/**
 * Strict JSON Schemas for Groq Structured Outputs (strict: true).
 * Strictly mirrors the Zod schemas: AIAnalysisReportSchema and VisualAnalysisResponseSchema.
 * 
 * Rules for Groq / OpenAI strict mode:
 * 1. Every property in 'properties' must be listed in 'required'.
 * 2. 'additionalProperties: false' must be set on every object schema.
 * 3. Root must be type: "object".
 */

export const TEXT_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    overallComplianceScore: {
      type: 'number',
      description: 'Brand compliance score from 0 to 100',
    },
    status: {
      type: 'string',
      enum: ['passed', 'warning', 'violations_found'],
      description: 'Overall compliance status',
    },
    summary: {
      type: 'string',
      description: 'Executive summary of brand compliance findings',
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: [
              'Tone inconsistency',
              'Terminology violation',
              'Incorrect or conflicting fact',
              'Unsupported promotional claim',
              'Messaging inconsistency',
              'Prohibited language',
              'Other guideline violation',
            ],
          },
          severity: {
            type: 'string',
            enum: ['Critical', 'High', 'Medium', 'Low'],
          },
          originalText: {
            type: 'string',
            description: 'Exact excerpt from the content with the issue',
          },
          explanation: {
            type: 'string',
            description: 'Why this violates brand guidelines',
          },
          supportingEvidence: {
            type: 'string',
            description: 'Citation of the guideline or fact',
          },
          suggestedCorrection: {
            type: 'string',
            description: 'Suggested replacement copy',
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0.0 and 1.0',
          },
          evidenceStatus: {
            type: 'string',
            enum: ['verified_violation', 'unsupported_claim', 'potential_issue', 'compliant'],
          },
        },
        required: [
          'category',
          'severity',
          'originalText',
          'explanation',
          'supportingEvidence',
          'suggestedCorrection',
          'confidence',
          'evidenceStatus',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['overallComplianceScore', 'status', 'summary', 'findings'],
  additionalProperties: false,
} as const;

export const VISUAL_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    overallVisualScore: {
      type: 'number',
      description: 'Visual compliance score from 0 to 100',
    },
    status: {
      type: 'string',
      enum: ['passed', 'warning', 'violations_found'],
      description: 'Overall visual compliance status',
    },
    summary: {
      type: 'string',
      description: 'Executive summary of visual compliance audit',
    },
    detectedColors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hex: {
            type: 'string',
            description: 'Dominant 6-character hex color code (e.g. #4F46E5)',
          },
          name: {
            type: 'string',
            description: 'Descriptive color name',
          },
          percentage: {
            type: 'number',
            description: 'Approximate percentage of image area',
          },
          isApprovedBrandColor: {
            type: 'boolean',
            description: 'Whether this color conforms to approved brand palette',
          },
        },
        required: ['hex', 'name', 'percentage', 'isApprovedBrandColor'],
        additionalProperties: false,
      },
    },
    logoAnalysis: {
      type: 'object',
      properties: {
        detected: {
          type: 'boolean',
          description: 'Whether the brand logo was detected in the creative',
        },
        placement: {
          type: 'string',
          description: 'Position of logo (e.g. top-left, bottom-right, not_detected)',
        },
        complianceStatus: {
          type: 'string',
          enum: ['compliant', 'warning', 'violation', 'not_detected'],
        },
        details: {
          type: 'string',
          description: 'Assessment of logo padding, integrity, and clear space',
        },
      },
      required: ['detected', 'placement', 'complianceStatus', 'details'],
      additionalProperties: false,
    },
    typographyAnalysis: {
      type: 'object',
      properties: {
        fontStyleDetected: {
          type: 'string',
          description: 'Identified font style (e.g. Sans-serif, Serif, Handwritten)',
        },
        readabilityScore: {
          type: 'number',
          description: 'Text legibility score from 0 to 100',
        },
        details: {
          type: 'string',
          description: 'Contrast and readability assessment',
        },
      },
      required: ['fontStyleDetected', 'readabilityScore', 'details'],
      additionalProperties: false,
    },
    visualFindings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: [
              'Logo usage & placement',
              'Color palette consistency',
              'Typography inconsistency',
              'Visual layout & contrast',
              'Brand visual style violation',
              'Other visual issue',
            ],
          },
          severity: {
            type: 'string',
            enum: ['Critical', 'High', 'Medium', 'Low'],
          },
          element: {
            type: 'string',
            description: 'Visual creative element inspected (e.g. Logo, Header, Background)',
          },
          explanation: {
            type: 'string',
            description: 'Why this element violates approved visual rules',
          },
          supportingEvidence: {
            type: 'string',
            description: 'Citation of the visual brand rule',
          },
          recommendation: {
            type: 'string',
            description: 'Actionable correction for design team',
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0.0 and 1.0',
          },
          evidenceStatus: {
            type: 'string',
            enum: ['verified_violation', 'unsupported_claim', 'potential_issue', 'compliant'],
          },
        },
        required: [
          'category',
          'severity',
          'element',
          'explanation',
          'supportingEvidence',
          'recommendation',
          'confidence',
          'evidenceStatus',
        ],
        additionalProperties: false,
      },
    },
  },
  required: [
    'overallVisualScore',
    'status',
    'summary',
    'detectedColors',
    'logoAnalysis',
    'typographyAnalysis',
    'visualFindings',
  ],
  additionalProperties: false,
} as const;

