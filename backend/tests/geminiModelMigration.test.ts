import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { AnalysisService } from '../src/services/analysis.service.js';
import { VisualAnalysisService } from '../src/services/visualAnalysis.service.js';

const app = createApp();

describe('Gemini 3.8 Flash Migration & Response Parsing Tests', () => {
  const originalEnvModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    if (originalEnvModel !== undefined) {
      process.env.GEMINI_MODEL = originalEnvModel;
    } else {
      delete process.env.GEMINI_MODEL;
    }
  });

  describe('1. Model Configuration and Environment Variable Handling', () => {
    it('defaults to gemini-3.8-flash when GEMINI_MODEL is not set', () => {
      delete process.env.GEMINI_MODEL;
      expect(AnalysisService.MODEL_NAME).toBe('gemini-3.8-flash');
      expect(VisualAnalysisService.MODEL_NAME).toBe('gemini-3.8-flash');
    });

    it('dynamically respects GEMINI_MODEL when configured in environment', () => {
      process.env.GEMINI_MODEL = 'gemini-3.8-flash-custom';
      expect(AnalysisService.MODEL_NAME).toBe('gemini-3.8-flash-custom');
      expect(VisualAnalysisService.MODEL_NAME).toBe('gemini-3.8-flash-custom');
    });

    it('health endpoint accurately reports the configured active Gemini model', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.aiService).toBeDefined();
      expect(res.body.aiService.provider).toBe('Google Gemini');
      expect(res.body.aiService.model).toBe('gemini-3.8-flash');
    });
  });

  describe('2. Text Analysis Response Parsing with Thinking Tokens', () => {
    it('correctly filters out internal reasoning/thought tokens and parses JSON response', () => {
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  thought: true,
                  text: 'Thinking Process:\n- Evaluating tone for enterprise consistency...\n- Guideline rule 4 applies...\n- No prohibited words found.\n- Ready to format JSON.',
                },
                {
                  text: JSON.stringify({
                    overallComplianceScore: 96,
                    status: 'passed',
                    summary: 'The submitted copy conforms to brand standards with authoritative tone.',
                    findings: [],
                  }),
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
      };

      const result = AnalysisService.parseGeminiResponse(mockGeminiResponse);
      expect(result).toBeDefined();
      expect(result.overallComplianceScore).toBe(96);
      expect(result.status).toBe('passed');
      expect(result.summary).toContain('authoritative tone');
      expect(result.findings).toHaveLength(0);
    });

    it('extracts JSON when wrapped in markdown codeblocks (```json ... ```)', () => {
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n{\n  "overallComplianceScore": 72,\n  "status": "warning",\n  "summary": "Flagged unsupported guarantee claim.",\n  "findings": [\n    {\n      "category": "Unsupported promotional claim",\n      "severity": "High",\n      "originalText": "100% bug-free guarantee",\n      "explanation": "Absolute bug-free claims are prohibited by brand governance.",\n      "supportingEvidence": "Official Guideline Section 3: No unverified technical absolutes.",\n      "suggestedCorrection": "Engineered for high enterprise reliability",\n      "confidence": 0.95,\n      "evidenceStatus": "verified_violation"\n    }\n  ]\n}\n```',
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
      };

      const result = AnalysisService.parseGeminiResponse(mockGeminiResponse);
      expect(result).toBeDefined();
      expect(result.overallComplianceScore).toBe(72);
      expect(result.status).toBe('warning');
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].category).toBe('Unsupported promotional claim');
      expect(result.findings[0].originalText).toBe('100% bug-free guarantee');
    });

    it('throws a descriptive error when Gemini response contains no valid text parts', () => {
      const emptyResponse = {
        candidates: [
          {
            content: { parts: [] },
            finishReason: 'SAFETY',
          },
        ],
      };

      expect(() => AnalysisService.parseGeminiResponse(emptyResponse)).toThrow(
        /Gemini API returned an empty candidate text response/
      );
    });
  });

  describe('3. Multimodal Visual Response Parsing with Thinking Tokens', () => {
    it('correctly filters thinking tokens and parses multimodal visual audit response', () => {
      const mockVisualResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  thought: true,
                  text: 'Visual Inspection:\n- Detected dominant hex colors: #4F46E5, #FF1493\n- Checking logo placement in top left corner...\n- Contrast ratio is 6.2:1\n- Formatting visual JSON schema.',
                },
                {
                  text: JSON.stringify({
                    overallVisualScore: 78,
                    status: 'warning',
                    summary: 'Visual creative contains unapproved hot pink accent (#FF1493).',
                    detectedColors: [
                      { hex: '#4F46E5', isApprovedBrandColor: true },
                      { hex: '#FF1493', isApprovedBrandColor: false },
                    ],
                    logoAnalysis: {
                      detected: true,
                      placement: 'top-left',
                      complianceStatus: 'compliant',
                      details: 'Logo is placed in top-left with adequate clear space.',
                    },
                    typographyAnalysis: {
                      fontStyleDetected: 'Sans-serif',
                      readabilityScore: 92,
                      details: 'High visual legibility and strong contrast.',
                    },
                    visualFindings: [
                      {
                        category: 'Color palette consistency',
                        severity: 'High',
                        element: 'CTA Button',
                        explanation: '#FF1493 violates approved brand palette rules.',
                        supportingEvidence: 'Brand palette strictly allows #4F46E5 and #10B981.',
                        recommendation: 'Replace button color with approved #4F46E5.',
                        confidence: 0.98,
                        evidenceStatus: 'verified_violation',
                      },
                    ],
                  }),
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
      };

      const result = VisualAnalysisService.parseGeminiMultimodalResponse(mockVisualResponse);
      expect(result).toBeDefined();
      expect(result.overallVisualScore).toBe(78);
      expect(result.status).toBe('warning');
      expect(result.detectedColors).toHaveLength(2);
      expect(result.detectedColors[1].hex).toBe('#FF1493');
      expect(result.detectedColors[1].isApprovedBrandColor).toBe(false);
      expect(result.logoAnalysis.complianceStatus).toBe('compliant');
      expect(result.visualFindings).toHaveLength(1);
    });

    it('throws a descriptive error when multimodal candidate is empty', () => {
      const emptyVisualResponse = {
        candidates: [
          {
            content: { parts: [] },
            finishReason: 'RECITATION',
          },
        ],
      };

      expect(() => VisualAnalysisService.parseGeminiMultimodalResponse(emptyVisualResponse)).toThrow(
        /Gemini Multimodal returned an empty response candidate/
      );
    });
  });

  describe('4. Generation Configuration Payload Audit for Gemini 3.8 Flash', () => {
    it('text analysis payload omits temperature, top_p, and top_k, retaining responseMimeType: application/json', async () => {
      let capturedPayload: any = null;
      const originalFetch = globalThis.fetch;
      const originalApiKey = ENV.GEMINI_API_KEY;
      (ENV as any).GEMINI_API_KEY = 'test-gemini-key-for-payload-audit';

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        if (init && init.body) {
          capturedPayload = JSON.parse(init.body as string);
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        overallComplianceScore: 90,
                        status: 'passed',
                        summary: 'Adheres to brand rules.',
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
      }) as any;

      try {
        await AnalysisService.analyzeContent('Test content for payload verification', 'blog', 'Test Title', {
          chunks: [],
          evidenceList: [],
          hasSufficientEvidence: true,
          guidelineChunkIds: [],
        });

        expect(capturedPayload).toBeDefined();
        expect(capturedPayload.generationConfig).toBeDefined();
        expect(capturedPayload.generationConfig.responseMimeType).toBe('application/json');
        expect(capturedPayload.generationConfig.temperature).toBeUndefined();
        expect(capturedPayload.generationConfig.top_p).toBeUndefined();
        expect(capturedPayload.generationConfig.top_k).toBeUndefined();
      } finally {
        globalThis.fetch = originalFetch;
        (ENV as any).GEMINI_API_KEY = originalApiKey;
      }
    });

    it('multimodal visual payload omits temperature, top_p, and top_k, retaining responseMimeType: application/json', async () => {
      let capturedPayload: any = null;
      const originalFetch = globalThis.fetch;
      const originalApiKey = ENV.GEMINI_API_KEY;
      (ENV as any).GEMINI_API_KEY = 'test-gemini-key-for-payload-audit';

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        if (init && init.body) {
          capturedPayload = JSON.parse(init.body as string);
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        overallVisualScore: 90,
                        status: 'passed',
                        summary: 'Visual checks passed.',
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
      }) as any;

      try {
        const fakeOrg: any = {
          brandVisualRules: {
            primaryColors: ['#4F46E5'],
            secondaryColors: [],
            prohibitedColors: [],
          },
        };

        await VisualAnalysisService.analyzeImage(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'image/png',
          fakeOrg
        );

        expect(capturedPayload).toBeDefined();
        expect(capturedPayload.generationConfig).toBeDefined();
        expect(capturedPayload.generationConfig.responseMimeType).toBe('application/json');
        expect(capturedPayload.generationConfig.temperature).toBeUndefined();
        expect(capturedPayload.generationConfig.top_p).toBeUndefined();
        expect(capturedPayload.generationConfig.top_k).toBeUndefined();
      } finally {
        globalThis.fetch = originalFetch;
        (ENV as any).GEMINI_API_KEY = originalApiKey;
      }
    });
  });

  describe('5. Timeout Configuration Handling for Gemini 3.8 Flash', () => {
    const originalEnvTimeout = process.env.GEMINI_TIMEOUT_MS;

    beforeEach(() => {
      delete process.env.GEMINI_TIMEOUT_MS;
    });

    afterEach(() => {
      if (originalEnvTimeout !== undefined) {
        process.env.GEMINI_TIMEOUT_MS = originalEnvTimeout;
      } else {
        delete process.env.GEMINI_TIMEOUT_MS;
      }
    });

    it('defaults REQUEST_TIMEOUT_MS to 60000ms (60 seconds) for both text and visual services', () => {
      delete process.env.GEMINI_TIMEOUT_MS;
      expect(AnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);
      expect(VisualAnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);
    });

    it('dynamically respects GEMINI_TIMEOUT_MS when configured in environment', () => {
      process.env.GEMINI_TIMEOUT_MS = '75000';
      expect(AnalysisService.REQUEST_TIMEOUT_MS).toBe(75000);
      expect(VisualAnalysisService.REQUEST_TIMEOUT_MS).toBe(75000);
    });

    it('safely falls back to 60000ms when GEMINI_TIMEOUT_MS is invalid, non-numeric, or too small', () => {
      process.env.GEMINI_TIMEOUT_MS = 'invalid_string';
      expect(AnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);
      expect(VisualAnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);

      process.env.GEMINI_TIMEOUT_MS = '-1000';
      expect(AnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);
      expect(VisualAnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);

      process.env.GEMINI_TIMEOUT_MS = '0';
      expect(AnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);
      expect(VisualAnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);

      process.env.GEMINI_TIMEOUT_MS = '1000'; // Less than 5000ms minimum threshold
      expect(AnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);
      expect(VisualAnalysisService.REQUEST_TIMEOUT_MS).toBe(60000);
    });
  });
});

