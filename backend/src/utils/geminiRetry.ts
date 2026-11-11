export interface GeminiRetryOptions {
  url: string;
  body: any;
  serviceName?: string;
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
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
 * Executes a Gemini POST request with exponential backoff and jitter.
 * Automatically retries transient 5xx/503 errors up to maxRetries (default 3).
 * Respects Google's 'Retry-After' header when supplied.
 * Immediately fails on non-retryable 400, 401, 403, and 404 errors.
 * Strictly guarantees that requests and backoff sleeps are actively aborted at the timeout deadline.
 */
export async function executeGeminiRequestWithRetry(options: GeminiRetryOptions): Promise<any> {
  const {
    url,
    body,
    serviceName = 'Gemini API',
    timeoutMs = 60000,
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 5000,
  } = options;

  const deadline = Date.now() + timeoutMs;
  const overallController = new AbortController();
  const overallTimeoutId = setTimeout(() => {
    overallController.abort();
  }, timeoutMs);

  let lastError: Error | null = null;
  const MIN_REMAINING_TIME_FOR_ATTEMPT_MS = 2000;

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const now = Date.now();
      if (now >= deadline || overallController.signal.aborted) {
        throw new Error(`${serviceName} request timed out after ${timeoutMs / 1000} seconds.`);
      }

      const remainingMs = deadline - now;
      if (attempt > 0 && remainingMs < MIN_REMAINING_TIME_FOR_ATTEMPT_MS) {
        console.warn(
          `[${serviceName}] Retry ${attempt}/${maxRetries} skipped: insufficient remaining time before deadline (${remainingMs}ms).`
        );
        throw lastError || new Error(`${serviceName} request timed out after ${timeoutMs / 1000} seconds.`);
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: overallController.signal,
          body: JSON.stringify(body),
        });

        if (response.ok) {
          return await response.json();
        }

        const responseText = await response.text();
        const status = response.status;
        const formattedError = formatGeminiHttpError(status, responseText, serviceName);

        // 400, 401, 403, 404: Fail immediately without retrying
        if (isNonRetryableStatus(status)) {
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
            if (Date.now() + retryAfterMs + MIN_REMAINING_TIME_FOR_ATTEMPT_MS > deadline) {
              console.warn(
                `[${serviceName}] Retry-After (${retryAfterMs}ms) exceeds remaining timeout deadline (${deadline - Date.now()}ms). Skipping retry.`
              );
              throw lastError;
            }
            sleepDelay = Math.min(Math.max(retryAfterMs, 500) + Math.random() * 300, maxDelayMs);
          } else {
            const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
            const jitter = Math.random() * 500;
            sleepDelay = Math.min(exponentialDelay + jitter, maxDelayMs);
          }

          if (Date.now() + sleepDelay + MIN_REMAINING_TIME_FOR_ATTEMPT_MS > deadline) {
            console.warn(
              `[${serviceName}] Retry ${attempt + 1}/${maxRetries} skipped: insufficient time before deadline (${Math.round(deadline - Date.now())}ms remaining).`
            );
            throw lastError;
          }

          console.warn(
            `[${serviceName}] Transient HTTP ${status} error. Retrying in ${Math.round(sleepDelay)}ms (attempt ${attempt + 1}/${maxRetries})...`
          );
          await sleep(sleepDelay, overallController.signal);
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || overallController.signal.aborted) {
          throw new Error(`${serviceName} request timed out after ${timeoutMs / 1000} seconds.`);
        }

        if (err.isNonRetryable) {
          throw err;
        }

        if (err.isTransient) {
          lastError = err;
        } else {
          // Network-level error
          lastError = err;
          if (attempt < maxRetries) {
            const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
            const jitter = Math.random() * 500;
            const sleepDelay = Math.min(exponentialDelay + jitter, maxDelayMs);

            if (Date.now() + sleepDelay + MIN_REMAINING_TIME_FOR_ATTEMPT_MS > deadline) {
              throw new Error(`${serviceName} request timed out after ${timeoutMs / 1000} seconds.`);
            }

            console.warn(
              `[${serviceName}] Transient network error (${err.message}). Retrying in ${Math.round(sleepDelay)}ms (attempt ${attempt + 1}/${maxRetries})...`
            );
            await sleep(sleepDelay, overallController.signal);
          }
        }
      }
    }

    throw lastError || new Error(`${serviceName} failed after ${maxRetries} retries.`);
  } finally {
    clearTimeout(overallTimeoutId);
  }
}
