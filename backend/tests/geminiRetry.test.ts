import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  executeGeminiRequestWithRetry,
  isNonRetryableStatus,
  isRetryableHttpStatus,
  formatGeminiHttpError,
  parseRetryAfterHeader,
} from '../src/utils/geminiRetry.js';
import { AnalysisService } from '../src/services/analysis.service.js';
import { VisualAnalysisService } from '../src/services/visualAnalysis.service.js';
import { ENV } from '../src/config/env.js';

describe('Gemini API Resilience, Retry & Error Handling Tests', () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = ENV.GEMINI_API_KEY;

  beforeEach(() => {
    (ENV as any).GEMINI_API_KEY = 'test-gemini-key-for-retry-tests';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (ENV as any).GEMINI_API_KEY = originalApiKey;
    vi.restoreAllMocks();
  });

  describe('1. HTTP Status Classification', () => {
    it('identifies 400, 401, 403, and 404 as strictly non-retryable', () => {
      expect(isNonRetryableStatus(400)).toBe(true);
      expect(isNonRetryableStatus(401)).toBe(true);
      expect(isNonRetryableStatus(403)).toBe(true);
      expect(isNonRetryableStatus(404)).toBe(true);

      expect(isNonRetryableStatus(500)).toBe(false);
      expect(isNonRetryableStatus(502)).toBe(false);
      expect(isNonRetryableStatus(503)).toBe(false);
      expect(isNonRetryableStatus(504)).toBe(false);
      expect(isNonRetryableStatus(429)).toBe(false);
      expect(isNonRetryableStatus(200)).toBe(false);
    });

    it('identifies 503, 500, 502, 504, and 429 as retryable transient errors', () => {
      expect(isRetryableHttpStatus(503)).toBe(true);
      expect(isRetryableHttpStatus(500)).toBe(true);
      expect(isRetryableHttpStatus(502)).toBe(true);
      expect(isRetryableHttpStatus(504)).toBe(true);
      expect(isRetryableHttpStatus(429)).toBe(true);

      expect(isRetryableHttpStatus(400)).toBe(false);
      expect(isRetryableHttpStatus(401)).toBe(false);
      expect(isRetryableHttpStatus(403)).toBe(false);
      expect(isRetryableHttpStatus(404)).toBe(false);
      expect(isRetryableHttpStatus(200)).toBe(false);
    });

    it('formats HTTP 503 with user-friendly temporary capacity message', () => {
      const google503Response = JSON.stringify({
        error: {
          code: 503,
          message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary.',
          status: 'UNAVAILABLE',
        },
      });

      const error = formatGeminiHttpError(503, google503Response);
      expect(error.message).toContain('HTTP 503: UNAVAILABLE');
      expect(error.message).toContain('currently experiencing high demand');
      expect(error.message).toContain('Re-Analyze');
      expect((error as any).isTransient).toBe(true);
    });
  });

  describe('2. Retry Execution Logic with Mock Fetch', () => {
    it('succeeds immediately on HTTP 200 without retrying', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(JSON.stringify({ result: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await executeGeminiRequestWithRetry({
        url: 'https://example.com/gemini',
        body: { test: true },
        baseDelayMs: 10,
        maxRetries: 3,
      });

      expect(callCount).toBe(1);
      expect(result).toEqual({ result: 'success' });
    });

    it('successfully retries after transient HTTP 503 and resolves on subsequent attempt', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              error: {
                code: 503,
                message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary.',
                status: 'UNAVAILABLE',
              },
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({ result: 'recovered_after_retry' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await executeGeminiRequestWithRetry({
        url: 'https://example.com/gemini',
        body: { test: true },
        baseDelayMs: 10, // Fast test delay
        maxRetries: 3,
      });

      expect(callCount).toBe(2);
      expect(result).toEqual({ result: 'recovered_after_retry' });
    });

    it('exhausts max 3 retries (4 total attempts) when HTTP 503 persists and throws friendly error', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(
          JSON.stringify({
            error: {
              code: 503,
              message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary.',
              status: 'UNAVAILABLE',
            },
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      });

      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: { test: true },
          baseDelayMs: 10,
          maxRetries: 3,
        })
      ).rejects.toThrow(/HTTP 503: UNAVAILABLE/);

      // 1 initial attempt + 3 retries = 4 total calls
      expect(callCount).toBe(4);
    });

    it('fails immediately without retrying on non-retryable HTTP 400', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(
          JSON.stringify({
            error: {
              code: 400,
              message: 'Invalid JSON payload structure.',
              status: 'INVALID_ARGUMENT',
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      });

      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: { bad: 'data' },
          baseDelayMs: 10,
          maxRetries: 3,
        })
      ).rejects.toThrow(/Bad Request \(Status 400\)/);

      expect(callCount).toBe(1);
    });

    it('fails immediately without retrying on non-retryable HTTP 401', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(
          JSON.stringify({
            error: {
              code: 401,
              message: 'API key not valid. Please pass a valid API key.',
              status: 'UNAUTHENTICATED',
            },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      });

      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: {},
          baseDelayMs: 10,
          maxRetries: 3,
        })
      ).rejects.toThrow(/Authentication Error \(Status 401\)/);

      expect(callCount).toBe(1);
    });

    it('fails immediately without retrying on non-retryable HTTP 403', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(
          JSON.stringify({
            error: {
              code: 403,
              message: 'Permission denied for resource.',
              status: 'PERMISSION_DENIED',
            },
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      });

      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: {},
          baseDelayMs: 10,
          maxRetries: 3,
        })
      ).rejects.toThrow(/Permission Denied \(Status 403\)/);

      expect(callCount).toBe(1);
    });

    it('fails immediately without retrying on non-retryable HTTP 404', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(
          JSON.stringify({
            error: {
              code: 404,
              message: 'models/gemini-invalid is not found for API version v1beta.',
              status: 'NOT_FOUND',
            },
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      });

      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: {},
          baseDelayMs: 10,
          maxRetries: 3,
        })
      ).rejects.toThrow(/Model Not Found \(Status 404\)/);

      expect(callCount).toBe(1);
    });

    it('does not retry indefinitely when timeout deadline is exceeded', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            error: { code: 503, message: 'High demand', status: 'UNAVAILABLE' },
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      });

      // Provide tiny 20ms timeout with 50ms base delay
      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: {},
          timeoutMs: 20,
          baseDelayMs: 50,
          maxRetries: 3,
        })
      ).rejects.toThrow();
    });
  });

  describe('3. Text Analysis Service Integration with Retry', () => {
    it('recovers and parses report when text analysis encounters 503 then succeeds', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              error: {
                code: 503,
                message: 'This model is currently experiencing high demand.',
                status: 'UNAVAILABLE',
              },
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        overallComplianceScore: 92,
                        status: 'passed',
                        summary: 'Adheres to brand rules after retry.',
                        findings: [],
                      }),
                    },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const report = await AnalysisService.analyzeContent('Test brand copy', 'blog', 'Test Title', {
        chunks: [],
        evidenceList: [],
        hasSufficientEvidence: true,
        guidelineChunkIds: [],
      });

      expect(callCount).toBe(2);
      expect(report.overallComplianceScore).toBe(92);
      expect(report.status).toBe('passed');
      expect(report.summary).toContain('Adheres to brand rules after retry');
    });
  });

  describe('4. Visual Analysis Service Integration with Retry', () => {
    it('recovers and parses visual report when multimodal visual analysis encounters 503 then succeeds', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              error: {
                code: 503,
                message: 'This model is currently experiencing high demand.',
                status: 'UNAVAILABLE',
              },
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        overallVisualScore: 88,
                        status: 'passed',
                        summary: 'Visual checks passed after retry.',
                        detectedColors: [],
                        logoAnalysis: { detected: true, complianceStatus: 'compliant', details: 'OK' },
                        typographyAnalysis: { fontStyleDetected: 'Sans', readabilityScore: 90, details: 'OK' },
                        visualFindings: [],
                      }),
                    },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const fakeOrg: any = {
        name: 'BrandLens Corp',
        brandVisualRules: {
          primaryColors: ['#4F46E5'],
          secondaryColors: [],
          prohibitedColors: [],
        },
      };

      const result = await VisualAnalysisService.analyzeImage(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'image/png',
        fakeOrg
      );

      expect(callCount).toBe(2);
      expect(result.overallVisualScore).toBe(88);
      expect(result.status).toBe('passed');
      expect(result.summary).toContain('Visual checks passed after retry');
    });
  });

  describe('5. Retry-After Header Handling & Timeout Protection', () => {
    it('correctly parses integer seconds and HTTP dates from Retry-After header', () => {
      expect(parseRetryAfterHeader('5')).toBe(5000);
      expect(parseRetryAfterHeader('2.5')).toBe(2500);
      expect(parseRetryAfterHeader('0')).toBe(0);
      expect(parseRetryAfterHeader(null)).toBeNull();
      expect(parseRetryAfterHeader('')).toBeNull();
      expect(parseRetryAfterHeader('invalid')).toBeNull();

      const futureDate = new Date(Date.now() + 10000).toUTCString();
      const parsed = parseRetryAfterHeader(futureDate);
      expect(parsed).toBeGreaterThanOrEqual(9000);
      expect(parsed).toBeLessThanOrEqual(11000);
    });

    it('respects Retry-After header sent by Google on HTTP 503 / 429', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          const headers = new Headers();
          headers.set('retry-after', '0.05'); // 50ms
          headers.set('Content-Type', 'application/json');
          return new Response(
            JSON.stringify({
              error: { code: 503, message: 'High demand', status: 'UNAVAILABLE' },
            }),
            { status: 503, headers }
          );
        }
        return new Response(JSON.stringify({ result: 'recovered' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await executeGeminiRequestWithRetry({
        url: 'https://example.com/gemini',
        body: {},
        timeoutMs: 5000,
      });

      expect(callCount).toBe(2);
      expect(result).toEqual({ result: 'recovered' });
    });

    it('actively aborts an in-progress fetch when overall timeout deadline fires', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async (_url, options) => {
        // Return a promise that waits longer than the timeout and listens to signal
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: {},
          timeoutMs: 50, // 50ms deadline
        })
      ).rejects.toThrow(/request timed out after 0.05 seconds/);
    });
  });

  describe('6. Two-Tier Timeout & Per-Attempt Recovery Tests', () => {
    it('recovers successfully when attempt 1 hits per-attempt timeout and attempt 2 succeeds', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, options) => {
        callCount++;
        if (callCount === 1) {
          // Attempt 1 hangs until aborted by its per-attempt timeout
          return new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          });
        }
        // Attempt 2 succeeds immediately
        return new Response(JSON.stringify({ result: 'recovered_after_per_attempt_timeout' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await executeGeminiRequestWithRetry({
        url: 'https://example.com/gemini',
        body: {},
        timeoutMs: 5000, // 5s overall deadline
        perAttemptTimeoutMs: 30, // 30ms per attempt
        baseDelayMs: 10,
        maxRetries: 3,
      });

      expect(callCount).toBe(2);
      expect(result).toEqual({ result: 'recovered_after_per_attempt_timeout' });
    });

    it('exhausts all retries when every attempt hits per-attempt timeout', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, options) => {
        callCount++;
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: {},
          timeoutMs: 5000,
          perAttemptTimeoutMs: 25,
          baseDelayMs: 10,
          maxRetries: 3,
        })
      ).rejects.toThrow(/timed out/);

      // 1 initial attempt + 3 retries = 4 attempts total
      expect(callCount).toBe(4);
    });

    it('overall deadline terminates attempts when overall timeout fires', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, options) => {
        callCount++;
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      await expect(
        executeGeminiRequestWithRetry({
          url: 'https://example.com/gemini',
          body: {},
          timeoutMs: 60, // 60ms overall
          perAttemptTimeoutMs: 150, // Per-attempt is longer than overall deadline
          baseDelayMs: 10,
          maxRetries: 3,
        })
      ).rejects.toThrow(/request timed out after 0.06 seconds/);
    });

    it('AnalysisService and VisualAnalysisService PER_ATTEMPT_TIMEOUT_MS defaults to 20000ms and validates env', () => {
      const originalEnv = process.env.GEMINI_PER_ATTEMPT_TIMEOUT_MS;
      try {
        delete process.env.GEMINI_PER_ATTEMPT_TIMEOUT_MS;
        expect(AnalysisService.PER_ATTEMPT_TIMEOUT_MS).toBe(20000);
        expect(VisualAnalysisService.PER_ATTEMPT_TIMEOUT_MS).toBe(20000);

        process.env.GEMINI_PER_ATTEMPT_TIMEOUT_MS = '25000';
        expect(AnalysisService.PER_ATTEMPT_TIMEOUT_MS).toBe(25000);
        expect(VisualAnalysisService.PER_ATTEMPT_TIMEOUT_MS).toBe(25000);

        // Invalid non-numeric or too small fallback
        process.env.GEMINI_PER_ATTEMPT_TIMEOUT_MS = 'invalid';
        expect(AnalysisService.PER_ATTEMPT_TIMEOUT_MS).toBe(20000);

        process.env.GEMINI_PER_ATTEMPT_TIMEOUT_MS = '1000'; // Less than 3000ms
        expect(AnalysisService.PER_ATTEMPT_TIMEOUT_MS).toBe(20000);
      } finally {
        if (originalEnv !== undefined) {
          process.env.GEMINI_PER_ATTEMPT_TIMEOUT_MS = originalEnv;
        } else {
          delete process.env.GEMINI_PER_ATTEMPT_TIMEOUT_MS;
        }
      }
    });
  });
});

