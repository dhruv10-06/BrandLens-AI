import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AnalysisService } from '../src/services/analysis.service.js';
import { VisualAnalysisService } from '../src/services/visualAnalysis.service.js';
import { ENV, validateAIProvider } from '../src/config/env.js';
import { TEXT_ANALYSIS_JSON_SCHEMA, VISUAL_ANALYSIS_JSON_SCHEMA } from '../src/utils/aiSchemas.js';
import { AIAnalysisReportSchema } from '../src/services/analysis.service.js';
import { VisualAnalysisResponseSchema } from '../src/services/visualAnalysis.service.js';
import { IOrganisation } from '../models/Organisation.js';
import { RAGRetrievalResult } from '../src/services/rag.service.js';

describe('Groq AI Provider Integration & Dual-Provider Resilience Tests', () => {
  const originalFetch = globalThis.fetch;
  const originalProvider = ENV.AI_PROVIDER;
  const originalGroqKey = ENV.GROQ_API_KEY;
  const originalGroqModel = ENV.GROQ_MODEL;
  const originalGeminiKey = ENV.GEMINI_API_KEY;
  const originalGeminiModel = ENV.GEMINI_MODEL;

  beforeEach(() => {
    ENV.AI_PROVIDER = 'groq';
    ENV.GROQ_API_KEY = 'gsk-mock-valid-groq-key-12345';
    ENV.GROQ_MODEL = 'qwen/qwen3.8-27b';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    ENV.AI_PROVIDER = originalProvider;
    ENV.GROQ_API_KEY = originalGroqKey;
    ENV.GROQ_MODEL = originalGroqModel;
    ENV.GEMINI_API_KEY = originalGeminiKey;
    ENV.GEMINI_MODEL = originalGeminiModel;
    vi.restoreAllMocks();
  });

  describe('1. Provider Configuration & Startup Validation', () => {
    it('accepts valid "gemini" and "groq" provider configurations', () => {
      expect(validateAIProvider('gemini')).toBe('gemini');
      expect(validateAIProvider('GEMINI')).toBe('gemini');
      expect(validateAIProvider(undefined)).toBe('gemini');
      expect(validateAIProvider('groq', 'gsk-key')).toBe('groq');
      expect(validateAIProvider('GROQ', 'gsk-key')).toBe('groq');
    });

    it('rejects unsupported AI provider values with a clear fatal error', () => {
      expect(() => validateAIProvider('anthropic')).toThrow(/FATAL CONFIGURATION ERROR: Invalid AI_PROVIDER "anthropic"/);
      expect(() => validateAIProvider('openai')).toThrow(/Supported providers are "gemini" and "groq"/);
    });

    it('fails clearly at startup if Groq is selected without GROQ_API_KEY', () => {
      expect(() => validateAIProvider('groq', '')).toThrow(
        /FATAL CONFIGURATION ERROR: AI_PROVIDER is set to "groq", but GROQ_API_KEY is not defined/
      );
      expect(() => validateAIProvider('groq', undefined)).toThrow(
        /Please set GROQ_API_KEY in your environment/
      );
    });

    it('dynamically reflects active provider and model in AnalysisService and VisualAnalysisService', () => {
      ENV.AI_PROVIDER = 'groq';
      expect(AnalysisService.PROVIDER).toBe('groq');
      expect(AnalysisService.MODEL_NAME).toBe('qwen/qwen3.8-27b');
      expect(VisualAnalysisService.PROVIDER).toBe('groq');
      expect(VisualAnalysisService.MODEL_NAME).toBe('qwen/qwen3.8-27b');

      ENV.AI_PROVIDER = 'gemini';
      expect(AnalysisService.PROVIDER).toBe('gemini');
      expect(AnalysisService.MODEL_NAME).toBe('gemini-3.8-flash');
      expect(VisualAnalysisService.PROVIDER).toBe('gemini');
      expect(VisualAnalysisService.MODEL_NAME).toBe('gemini-3.8-flash');
    });

    it('health endpoint accurately reports Groq as provider when configured', async () => {
      ENV.AI_PROVIDER = 'groq';
      ENV.GROQ_API_KEY = 'gsk-test-key';
      ENV.GROQ_MODEL = 'qwen/qwen3.8-27b';

      const app = createApp();
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.aiService.provider).toBe('Groq');
      expect(res.body.aiService.model).toBe('qwen/qwen3.8-27b');
      expect(res.body.aiService.configured).toBe(true);
    });
  });

  describe('2. Strict JSON Schema Definitions', () => {
    it('verifies TEXT_ANALYSIS_JSON_SCHEMA conforms to Groq strict mode requirements', () => {
      expect(TEXT_ANALYSIS_JSON_SCHEMA.type).toBe('object');
      expect(TEXT_ANALYSIS_JSON_SCHEMA.additionalProperties).toBe(false);
      expect(Array.isArray(TEXT_ANALYSIS_JSON_SCHEMA.required)).toBe(true);

      // In OpenAI/Groq strict mode, every key in properties must appear in required
      const topProps = Object.keys(TEXT_ANALYSIS_JSON_SCHEMA.properties);
      for (const prop of topProps) {
        expect(TEXT_ANALYSIS_JSON_SCHEMA.required).toContain(prop);
      }

      // Check nested findings object
      const findingsItem = TEXT_ANALYSIS_JSON_SCHEMA.properties.findings.items;
      expect(findingsItem.additionalProperties).toBe(false);
      const findingProps = Object.keys(findingsItem.properties);
      for (const prop of findingProps) {
        expect(findingsItem.required).toContain(prop);
      }
    });

    it('verifies VISUAL_ANALYSIS_JSON_SCHEMA conforms to Groq strict mode requirements', () => {
      expect(VISUAL_ANALYSIS_JSON_SCHEMA.type).toBe('object');
      expect(VISUAL_ANALYSIS_JSON_SCHEMA.additionalProperties).toBe(false);

      const topProps = Object.keys(VISUAL_ANALYSIS_JSON_SCHEMA.properties);
      for (const prop of topProps) {
        expect(VISUAL_ANALYSIS_JSON_SCHEMA.required).toContain(prop);
      }

      const colorItem = VISUAL_ANALYSIS_JSON_SCHEMA.properties.detectedColors.items;
      expect(colorItem.additionalProperties).toBe(false);
      for (const prop of Object.keys(colorItem.properties)) {
        expect(colorItem.required).toContain(prop);
      }
    });
  });

  describe('3. Groq Text Analysis Execution & Payload Verification', () => {
    const mockRagResult: RAGRetrievalResult = {
      evidenceList: [
        {
          documentId: 'doc-1',
          title: 'Brand Tone Guide',
          content: 'Brand voice must always remain confident and professional. Never use slang like "insane" or "hyped".',
          sourceType: 'guideline',
          relevanceScore: 0.95,
        },
      ],
      hasSufficientEvidence: true,
      factsSummary: 'BrandLens was founded in 2024.',
    };

    const mockGroqTextResponse = {
      id: 'chatcmpl-test-groq-123',
      object: 'chat.completion',
      created: 1720000000,
      model: 'qwen/qwen3.8-27b',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              overallComplianceScore: 88,
              status: 'warning',
              summary: 'Content largely aligns with brand voice, but contains an informal colloquial term that deviates from our professional tone standard.',
              findings: [
                {
                  category: 'Tone inconsistency',
                  severity: 'Medium',
                  originalText: 'We offer hyped delivery speeds',
                  explanation: 'The term "hyped" conflicts with our confident, professional tone guideline.',
                  supportingEvidence: 'Brand voice must always remain confident and professional. Never use slang like "insane" or "hyped".',
                  suggestedCorrection: 'We offer industry-leading delivery speeds',
                  confidence: 0.95,
                  evidenceStatus: 'verified_violation',
                },
              ],
            }),
          },
          finish_reason: 'stop',
        },
      ],
    };

    it('sends correct Groq headers, model, reasoning_format: hidden, and strict JSON schema in text request', async () => {
      let capturedUrl = '';
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
        capturedUrl = url.toString();
        capturedHeaders = init?.headers as Record<string, string>;
        capturedBody = JSON.parse(init?.body as string);
        return new Response(JSON.stringify(mockGroqTextResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'x-groq-request-id': 'groq-req-tx-999',
          },
        });
      });

      const report = await AnalysisService.analyzeContent(
        'We offer hyped delivery speeds to all enterprise customers.',
        'social_post',
        'Social Speed Campaign',
        mockRagResult
      );

      // Verify URL & Headers
      expect(capturedUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(capturedHeaders['Authorization']).toBe(`Bearer ${ENV.GROQ_API_KEY}`);
      expect(capturedHeaders['Content-Type']).toBe('application/json');

      // Verify Body parameters
      expect(capturedBody.model).toBe('qwen/qwen3.8-27b');
      expect(capturedBody.reasoning_format).toBe('hidden');
      expect(capturedBody.reasoning_effort).toBe('none');
      expect(capturedBody.response_format.type).toBe('json_schema');
      expect(capturedBody.response_format.json_schema.strict).toBe(true);
      expect(capturedBody.response_format.json_schema.name).toBe('brand_compliance_analysis_report');
      expect(capturedBody.response_format.json_schema.schema).toEqual(TEXT_ANALYSIS_JSON_SCHEMA);

      // Verify prompt grounding & anti-injection delimiters
      const userMessage = capturedBody.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).toContain('<<<SUBMITTED_CONTENT>>>');
      expect(userMessage.content).toContain('We offer hyped delivery speeds to all enterprise customers.');
      expect(userMessage.content).toContain('APPROVED BRAND EVIDENCE:');

      // Verify parsed output
      expect(report.overallComplianceScore).toBe(88);
      expect(report.status).toBe('warning');
      expect(report.findings).toHaveLength(1);
      expect(report.findings[0].category).toBe('Tone inconsistency');
      expect(report.aiModelUsed).toBe('qwen/qwen3.8-27b');
    });

    it('safely parses Groq response wrapped in markdown codeblocks and validates with Zod', () => {
      const wrappedData = {
        choices: [
          {
            message: {
              content: '```json\n' + JSON.stringify({
                overallComplianceScore: 100,
                status: 'passed',
                summary: 'All marketing copy strictly conforms to approved guidelines.',
                findings: [],
              }) + '\n```',
            },
            finish_reason: 'stop',
          },
        ],
      };

      const result = AnalysisService.parseGroqResponse(wrappedData);
      expect(result.overallComplianceScore).toBe(100);
      expect(result.status).toBe('passed');
      expect(result.findings).toEqual([]);
    });

    it('rejects malformed Groq response missing required Zod fields', () => {
      const invalidData = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallComplianceScore: 90,
                // missing status and summary
                findings: [],
              }),
            },
          },
        ],
      };

      expect(() => AnalysisService.parseGroqResponse(invalidData)).toThrow();
    });

    it('throws descriptive error if Groq returns empty content', () => {
      const emptyData = {
        choices: [
          {
            message: {
              content: '',
            },
            finish_reason: 'stop',
          },
        ],
      };

      expect(() => AnalysisService.parseGroqResponse(emptyData)).toThrow(
        /Groq API returned an empty completion response/
      );
    });
  });

  describe('4. Groq Visual Multimodal Analysis & Vision Payload Verification', () => {
    const mockOrg: IOrganisation = {
      name: 'Acme Corporation',
      brandVisualRules: {
        primaryColors: ['#4F46E5', '#0F172A', '#FFFFFF'],
        secondaryColors: ['#10B981', '#6366F1'],
        prohibitedColors: ['#FF1493', '#FFFF00'],
        logoGuidelines: 'Clear space around logo, placed in top corner.',
        typographyRules: 'Modern sans-serif typography, readable contrast.',
      },
    } as any;

    const mockGroqVisualResponse = {
      id: 'chatcmpl-visual-groq-456',
      object: 'chat.completion',
      created: 1720000000,
      model: 'qwen/qwen3.8-27b',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              overallVisualScore: 92,
              status: 'passed',
              summary: 'Visual creative adheres to brand palette and typography standards with appropriate logo placement.',
              detectedColors: [
                { hex: '#4F46E5', name: 'Brand Indigo', percentage: 65, isApprovedBrandColor: true },
                { hex: '#FFFFFF', name: 'White', percentage: 25, isApprovedBrandColor: true },
                { hex: '#0F172A', name: 'Dark Slate', percentage: 10, isApprovedBrandColor: true },
              ],
              logoAnalysis: {
                detected: true,
                placement: 'top-left',
                complianceStatus: 'compliant',
                details: 'Logo clearly positioned in the top-left quadrant with adequate clear space.',
              },
              typographyAnalysis: {
                fontStyleDetected: 'Modern Sans-Serif',
                readabilityScore: 95,
                details: 'Clean sans-serif headline with high contrast against the indigo background.',
              },
              visualFindings: [],
            }),
          },
          finish_reason: 'stop',
        },
      ],
    };

    it('sends correct multimodal vision payload with base64 data URL to Groq', async () => {
      let capturedUrl = '';
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
        capturedUrl = url.toString();
        capturedHeaders = init?.headers as Record<string, string>;
        capturedBody = JSON.parse(init?.body as string);
        return new Response(JSON.stringify(mockGroqVisualResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'x-groq-request-id': 'groq-visual-req-123',
          },
        });
      });

      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const result = await VisualAnalysisService.analyzeImage(
        base64Data,
        'image/png',
        mockOrg,
        'Banner Ad',
        'Spring Collection'
      );

      // Verify endpoint and auth
      expect(capturedUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(capturedHeaders['Authorization']).toBe(`Bearer ${ENV.GROQ_API_KEY}`);

      // Verify payload structure
      expect(capturedBody.model).toBe('qwen/qwen3.8-27b');
      expect(capturedBody.reasoning_format).toBe('hidden');
      expect(capturedBody.reasoning_effort).toBe('none');
      expect(capturedBody.response_format.type).toBe('json_schema');
      expect(capturedBody.response_format.json_schema.strict).toBe(true);
      expect(capturedBody.response_format.json_schema.name).toBe('visual_brand_compliance_report');

      // Verify user message content array includes text and image_url
      const userMessage = capturedBody.messages.find((m: any) => m.role === 'user');
      expect(Array.isArray(userMessage.content)).toBe(true);

      const textPart = userMessage.content.find((p: any) => p.type === 'text');
      const imagePart = userMessage.content.find((p: any) => p.type === 'image_url');

      expect(textPart).toBeDefined();
      expect(imagePart).toBeDefined();
      expect(imagePart.image_url.url).toBe(`data:image/png;base64,${base64Data}`);

      // Verify visual result
      expect(result.overallVisualScore).toBe(92);
      expect(result.status).toBe('passed');
      expect(result.logoAnalysis.detected).toBe(true);
      expect(result.aiModelUsed).toBe('qwen/qwen3.8-27b');
    });

    it('safely parses Groq multimodal response and validates against VisualAnalysisResponseSchema', () => {
      const parsed = VisualAnalysisService.parseGroqMultimodalResponse(mockGroqVisualResponse);
      expect(parsed.overallVisualScore).toBe(92);
      expect(parsed.detectedColors).toHaveLength(3);
      expect(parsed.logoAnalysis.complianceStatus).toBe('compliant');
    });
  });

  describe('5. Error Handling, Resilience & Fast-Fail on Groq', () => {
    it('fast-fails immediately without retrying on HTTP 401 Authentication Error', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid API Key provided',
              type: 'invalid_request_error',
              code: 'invalid_api_key',
            },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      });

      await expect(
        AnalysisService.analyzeContent('Test content', 'blog', 'Test', {
          evidenceList: [],
          hasSufficientEvidence: false,
        })
      ).rejects.toThrow(/Groq API Authentication Error \(Status 401\)/);

      expect(callCount).toBe(1); // Never retried
    });

    it('retries on HTTP 429 Rate Limit and succeeds on subsequent attempt', async () => {
      let callCount = 0;
      const validResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallComplianceScore: 95,
                status: 'passed',
                summary: 'Compliant copy.',
                findings: [],
              }),
            },
          },
        ],
      };

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Rate limit reached for model qwen/qwen3.8-27b',
                type: 'tokens',
              },
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '0.1',
              },
            }
          );
        }
        return new Response(JSON.stringify(validResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const report = await AnalysisService.analyzeContent('Test content', 'blog', 'Test', {
        evidenceList: [],
        hasSufficientEvidence: false,
      });

      expect(callCount).toBe(2);
      expect(report.overallComplianceScore).toBe(95);
    });

    it('exhausts retries and returns clear error when Groq returns persistent HTTP 503', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return new Response(
          JSON.stringify({
            error: {
              message: 'Service unavailable due to temporary capacity constraints',
            },
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      });

      // Override retry delay in test by setting small mock
      await expect(
        AnalysisService.analyzeContent('Test content', 'blog', 'Test', {
          evidenceList: [],
          hasSufficientEvidence: false,
        })
      ).rejects.toThrow(/Groq AI service is currently experiencing high demand/);

      expect(callCount).toBe(4); // Initial + 3 retries
    });
  });

  describe('6. Gemini Regression Verification when AI_PROVIDER is gemini', () => {
    it('calls Google Gemini endpoint when AI_PROVIDER is gemini and GEMINI_API_KEY is present', async () => {
      ENV.AI_PROVIDER = 'gemini';
      ENV.GEMINI_API_KEY = 'mock-gemini-key';
      ENV.GEMINI_MODEL = 'gemini-3.8-flash';

      let capturedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url) => {
        capturedUrl = url.toString();
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        overallComplianceScore: 100,
                        status: 'passed',
                        summary: 'Audited by Gemini.',
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

      const report = await AnalysisService.analyzeContent('Test content', 'social', 'Gemini Test', {
        evidenceList: [],
        hasSufficientEvidence: false,
      });

      expect(capturedUrl).toContain('generativelanguage.googleapis.com');
      expect(capturedUrl).toContain('gemini-3.8-flash:generateContent');
      expect(capturedUrl).toContain(`key=${ENV.GEMINI_API_KEY}`);
      expect(report.aiModelUsed).toBe('gemini-3.8-flash');
    });
  });
});

