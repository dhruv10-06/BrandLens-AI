import { describe, it, expect } from 'vitest';
import {
  FindingSchema,
  AIAnalysisReportSchema,
  AnalysisService,
} from '../src/services/analysis.service.js';

describe('Analysis and Findings Validation', () => {
  it('should validate a valid finding against the strict Zod schema', () => {
    const validFinding = {
      category: 'Prohibited language',
      severity: 'Critical',
      originalText: 'cheap tool',
      explanation: 'Brand rules prohibit using the word cheap.',
      supportingEvidence: 'ApexFlow Pricing Guidelines Section 2',
      suggestedCorrection: 'cost-effective enterprise platform',
      confidence: 0.95,
      evidenceStatus: 'verified_violation',
    };

    const parsed = FindingSchema.parse(validFinding);
    expect(parsed.category).toBe('Prohibited language');
    expect(parsed.severity).toBe('Critical');
  });

  it('should reject a finding with invalid category or missing evidenceStatus', () => {
    const invalidFinding = {
      category: 'Unknown category name',
      severity: 'Critical',
      originalText: 'test',
      explanation: 'test',
      supportingEvidence: 'test',
      suggestedCorrection: 'test',
    };

    expect(() => FindingSchema.parse(invalidFinding)).toThrow();
  });

  it('should distinguish unsupported claims from verified violations in rule analysis', () => {
    const mockRagResult = {
      evidenceList: [
        {
          id: '1',
          sourceType: 'terminology' as const,
          title: 'Official Rule: Prohibited Term',
          content: '• Prohibited: "cheap" -> Reason / Preferred: "cost-effective"',
          similarityScore: 1.0,
        },
      ],
      guidelineChunkIds: [],
      factsSummary: '• Prohibited: "cheap" -> Preferred: "cost-effective"',
      hasSufficientEvidence: true,
    };

    const content = 'Our software is the cheapest in the world and guaranteed 100% bug-free!';
    const result = AnalysisService.runRuleBasedAnalysis(
      content,
      'advertisement',
      'Ad Draft',
      mockRagResult
    );

    expect(result.findings.length).toBeGreaterThan(0);
    // Should have detected unsupported promotional claims
    const unsupported = result.findings.find(
      (f) => f.category === 'Unsupported promotional claim'
    );
    expect(unsupported).toBeDefined();
    expect(unsupported?.evidenceStatus).toBe('unsupported_claim');
    expect(unsupported?.supportingEvidence).toContain('Verification is unavailable');

    // Should validate through full AIAnalysisReportSchema
    const validated = AIAnalysisReportSchema.parse(result);
    expect(validated.overallComplianceScore).toBeLessThan(90);
  });
});
