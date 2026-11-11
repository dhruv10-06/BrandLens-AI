export interface GeminiRetryOptions {
  url: string;
  body: any;
  serviceName?: string;
  timeoutMs?: number; // Overall analysis deadline (default 60000ms)
  perAttemptTimeoutMs?: number; // Per-attempt timeout (default 20000ms)
  maxRetries?: number; // Max retry count (default 3)
  baseDelayMs?: number; // Base exponential backoff delay (default 1000ms)
  maxDelayMs?: number; // Cap on backoff delay (default 5000ms)
}

export function isNonRetryableStatus(status: number): boolean {
  return status === 400 || status === 401 || status === 403 || status === 404;
}

export function isRetryableHttpStatus(status: number): boolean {
  if (isNonRetryableStatus(status)) {
    return false;
  }
  return status === 503 || status === 500 || status === 502 || status === 504 || status === 429;
}

/**
 * Safely parses the HTTP 'Retry-After' header if provided by Google.
 * Can be either an integer in seconds (e.g. "5") or an HTTP date string.
 * Returns the delay in milliseconds, or null if missing/unparseable.
 */
export function parseRetryAfterHeader(headerValue: string | null | undefined): number | null {
  if (!headerValue) return null;
  const trimmed = headerValue.trim();
  const seconds = parseFloat(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }
  const timestamp = Date.parse(trimmed);
  if (Number.isFinite(timestamp)) {
    const diff = timestamp - Date.now();
    return diff > 0 ? diff : 0;
  }
  return null;
}

/**
 * Formats Google API error responses safely while preserving detailed server messages.
 */
export function formatGeminiHttpError(status: number, responseText: string, serviceName = 'Gemini API'): Error {
  let parsedMessage = '';
  let errorStatus = '';
  try {
    const json = JSON.parse(responseText);
    parsedMessage = json?.error?.message || '';
    errorStatus = json?.error?.status || '';
  } catch {
    parsedMessage = responseText;
  }

  const effectiveDetail = parsedMessage || responseText;

  if (status === 503) {
    const detail = parsedMessage ? ` (${parsedMessage})` : '';
    const err = new Error(
      `The Google Gemini AI service is currently experiencing high demand (HTTP 503: UNAVAILABLE)${detail}. Spikes in demand are usually temporary. Please wait a moment and click "Re-Analyze" to retry.`
    );
    (err as any).statusCode = 503;
    (err as any).isTransient = true;
    (err as any).apiErrorDetails = effectiveDetail;
    (err as any).apiErrorStatus = errorStatus || 'UNAVAILABLE';
    return err;
  }

  if (status === 400) {
    const err = new Error(
      `${serviceName} Bad Request (Status 400)${errorStatus ? ` [${errorStatus}]` : ''}: ${effectiveDetail || 'Invalid request payload.'}`
    );
    (err as any).statusCode = 400;
    (err as any).isNonRetryable = true;
    (err as any).apiErrorDetails = effectiveDetail;
    return err;
  }

  if (status === 401) {
    const err = new Error(
      `${serviceName} Authentication Error (Status 401)${errorStatus ? ` [${errorStatus}]` : ''}: ${effectiveDetail || 'Invalid or missing API key.'}`
    );
    (err as any).statusCode = 401;
    (err as any).isNonRetryable = true;
    (err as any).apiErrorDetails = effectiveDetail;
    return err;
  }

  if (status === 403) {
    const err = new Error(
      `${serviceName} Permission Denied (Status 403)${errorStatus ? ` [${errorStatus}]` : ''}: ${effectiveDetail || 'Access to model forbidden.'}`
    );
    (err as any).statusCode = 403;
    (err as any).isNonRetryable = true;
    (err as any).apiErrorDetails = effectiveDetail;
    return err;
  }

  if (status === 404) {
    const err = new Error(
      `${serviceName} Model Not Found (Status 404)${errorStatus ? ` [${errorStatus}]` : ''}: ${effectiveDetail || 'Configured model does not exist.'}`
    );
    (err as any).statusCode = 404;
    (err as any).isNonRetryable = true;
    (err as any).apiErrorDetails = effectiveDetail;
    return err;
  }

  if (status === 429) {
    const err = new Error(
      `${serviceName} Rate Limit Exceeded (Status 429)${errorStatus ? ` [${errorStatus}]` : ''}: ${effectiveDetail || 'Quota exceeded. Please retry shortly.'}`
    );
    (err as any).statusCode = 429;
    (err as any).isTransient = true;
    (err as any).apiErrorDetails = effectiveDetail;
    return err;
  }

  const err = new Error(
    `${serviceName} Error (Status ${status})${errorStatus ? ` [${errorStatus}]` : ''}: ${effectiveDetail || responseText}`
  );
  (err as any).statusCode = status;
  if (status >= 500) {
    (err as any).isTransient = true;
  }
  (err as any).apiErrorDetails = effectiveDetail;
  return err;
}

/**
 * Abortable sleep helper that cancels immediately if the abort signal triggers.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const abortErr = new Error('Request aborted due to timeout.');
      abortErr.name = 'AbortError';
      return reject(abortErr);
    }

    const timer = setTimeout(() => {
      resolve();
    }, ms);

    if (signal) {
      const abortHandler = () => {
        clearTimeout(timer);
        const abortErr = new Error('Request aborted due to timeout.');
        abortErr.name = 'AbortError';
        reject(abortErr);
      };
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  });
}

/**
 * Executes a Gemini POST request with resilient retry handling:
 * 1. Two-tier timeout protection:
 *    - Per-attempt timeout (default 20s): aborts a stalled individual connection and triggers a fresh retry.
 *    - Overall deadline (default 60s): hard ceiling that terminates all attempts and pending delays.
 * 2. Exponential backoff with jitter up to maxRetries (default 3 retries, 4 attempts max).
 * 3. Respects Google's 'Retry-After' header when returned.
 * 4. Fails fast on non-retryable 4xx errors (400, 401, 403, 404).
 * 5. Emits structured diagnostic logs with timestamps, latencies, status codes, and Google Request IDs.
 */
export async function executeGeminiRequestWithRetry(options: GeminiRetryOptions): Promise<any> {
  const {
    url,
    body,
    serviceName = 'Gemini API',
    timeoutMs = 60000,
    perAttemptTimeoutMs = 20000,
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 5000,
  } = options;

  const overallDeadline = Date.now() + timeoutMs;
  const overallController = new AbortController();
  const overallTimeoutId = setTimeout(() => {
    overallController.abort('OVERALL_TIMEOUT');
  }, timeoutMs);

  let lastError: Error | null = null;
  const MIN_REMAINING_TIME_FOR_ATTEMPT_MS = 2000;

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const now = Date.now();
      if (now >= overallDeadline || overallController.signal.aborted) {
        console.error(
          `[${serviceName}] Overall analysis deadline (${timeoutMs / 1000}s) expired before attempt ${attempt + 1}.`
        );
        throw new Error(`${serviceName} request timed out after ${timeoutMs / 1000} seconds.`);
      }

      const remainingOverallMs = overallDeadline - now;
      if (attempt > 0 && remainingOverallMs < MIN_REMAINING_TIME_FOR_ATTEMPT_MS) {
        console.warn(
          `[${serviceName}] Retry ${attempt}/${maxRetries} skipped: insufficient remaining time before overall deadline (${remainingOverallMs}ms).`
        );
        throw lastError || new Error(`${serviceName} request timed out after ${timeoutMs / 1000} seconds.`);
      }

      // Per-attempt timeout capped at remaining overall time
      const attemptTimeout = Math.min(perAttemptTimeoutMs, remainingOverallMs);
      const attemptStart = Date.now();
      console.log(
        `[${serviceName}] Attempt ${attempt + 1}/${maxRetries + 1} started at ${new Date(attemptStart).toISOString()} (attempt timeout: ${attemptTimeout}ms, overall remaining: ${Math.round(remainingOverallMs)}ms)`
      );

      // Create a dedicated per-attempt controller linked to the overall controller
      const attemptController = new AbortController();
      const attemptTimeoutId = setTimeout(() => {
        attemptController.abort('ATTEMPT_TIMEOUT');
      }, attemptTimeout);

      const onOverallAbort = () => {
        attemptController.abort('OVERALL_TIMEOUT');
      };
      overallController.signal.addEventListener('abort', onOverallAbort, { once: true });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: attemptController.signal,
          body: JSON.stringify(body),
        });

        clearTimeout(attemptTimeoutId);
        overallController.signal.removeEventListener('abort', onOverallAbort);

        const durationMs = Date.now() - attemptStart;
        const requestId =
          response.headers?.get?.('x-goog-request-id') || response.headers?.get?.('x-request-id') || 'none';
        console.log(
          `[${serviceName}] Attempt ${attempt + 1} completed in ${durationMs}ms - Status: HTTP ${response.status} (Google Request ID: ${requestId})`
        );

        if (response.ok) {
          return await response.json();
        }

        const responseText = await response.text();
        const status = response.status;
        const formattedError = formatGeminiHttpError(status, responseText, serviceName);

        // Non-retryable statuses (400, 401, 403, 404): Fail fast immediately
        if (isNonRetryableStatus(status)) {
          console.error(
            `[${serviceName}] Attempt ${attempt + 1} failed with non-retryable HTTP ${status} in ${durationMs}ms (Google Request ID: ${requestId}): ${formattedError.message}`
          );
          throw formattedError;
        }

        if (!isRetryableHttpStatus(status)) {
          throw formattedError;
        }

        lastError = formattedError;

        if (attempt < maxRetries) {
          // Check for Retry-After header
          const retryAfterHeader = response.headers?.get ? response.headers.get('retry-after') : null;
          const retryAfterMs = parseRetryAfterHeader(retryAfterHeader);

          let sleepDelay: number;
          if (retryAfterMs !== null) {
            if (Date.now() + retryAfterMs + MIN_REMAINING_TIME_FOR_ATTEMPT_MS > overallDeadline) {
              console.warn(
                `[${serviceName}] Retry-After (${retryAfterMs}ms) exceeds overall deadline (${Math.round(overallDeadline - Date.now())}ms remaining). Skipping retry.`
              );
              throw lastError;
            }
            sleepDelay = Math.min(Math.max(retryAfterMs, 500) + Math.random() * 300, maxDelayMs);
          } else {
            const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
            const jitter = Math.random() * 500;
            sleepDelay = Math.min(exponentialDelay + jitter, maxDelayMs);
          }

          if (Date.now() + sleepDelay + MIN_REMAINING_TIME_FOR_ATTEMPT_MS > overallDeadline) {
            console.warn(
              `[${serviceName}] Retry ${attempt + 1}/${maxRetries} skipped: backoff delay (${Math.round(sleepDelay)}ms) exceeds overall deadline.`
            );
            throw lastError;
          }

          console.warn(
            `[${serviceName}] Attempt ${attempt + 1} failed with transient HTTP ${status}. Retrying in ${Math.round(sleepDelay)}ms (attempt ${attempt + 2}/${maxRetries + 1})...`
          );
          await sleep(sleepDelay, overallController.signal);
        }
      } catch (err: any) {
        clearTimeout(attemptTimeoutId);
        overallController.signal.removeEventListener('abort', onOverallAbort);

        const durationMs = Date.now() - attemptStart;
        const isOverallTimeout = overallController.signal.aborted || Date.now() >= overallDeadline;

        if (isOverallTimeout) {
          console.error(
            `[${serviceName}] Overall analysis deadline (${timeoutMs / 1000}s) expired during Attempt ${attempt + 1} after ${durationMs}ms in-flight.`
          );
          throw new Error(`${serviceName} request timed out after ${timeoutMs / 1000} seconds.`);
        }

        if (err.isNonRetryable) {
          throw err;
        }

        const isAttemptTimeout = err.name === 'AbortError' || attemptController.signal.aborted;

        if (isAttemptTimeout) {
          console.warn(
            `[${serviceName}] Attempt ${attempt + 1}/${maxRetries + 1} timed out after ${durationMs}ms waiting for response (per-attempt limit: ${attemptTimeout}ms). Overall remaining: ${Math.round(overallDeadline - Date.now())}ms.`
          );
          lastError = new Error(
            `${serviceName} attempt ${attempt + 1} timed out after ${attemptTimeout / 1000}s without response from Google.`
          );
          (lastError as any).isTransient = true;
        } else if (err.isTransient) {
          lastError = err;
        } else {
          // Network-level error (e.g. connection reset, socket error)
          console.warn(
            `[${serviceName}] Attempt ${attempt + 1} encountered network error in ${durationMs}ms: ${err.message}`
          );
          lastError = err;
          (lastError as any).isTransient = true;
        }

        // If retries remain and overall time is sufficient, sleep and retry!
        if (attempt < maxRetries) {
          const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
          const jitter = Math.random() * 500;
          const sleepDelay = Math.min(exponentialDelay + jitter, maxDelayMs);

          if (Date.now() + sleepDelay + MIN_REMAINING_TIME_FOR_ATTEMPT_MS > overallDeadline) {
            console.warn(
              `[${serviceName}] Cannot retry after attempt ${attempt + 1}: backoff delay exceeds remaining overall deadline.`
            );
            throw lastError || new Error(`${serviceName} request timed out after ${timeoutMs / 1000} seconds.`);
          }

          console.warn(
            `[${serviceName}] Retrying in ${Math.round(sleepDelay)}ms (next attempt: ${attempt + 2}/${maxRetries + 1})...`
          );
          await sleep(sleepDelay, overallController.signal);
        }
      }
    }

    console.error(`[${serviceName}] All ${maxRetries + 1} attempts exhausted without successful response.`);
    throw lastError || new Error(`${serviceName} failed after ${maxRetries} retries.`);
  } finally {
    clearTimeout(overallTimeoutId);
  }
}
