import mongoose, { Document, Schema } from 'mongoose';

export type FindingCategory =
  | 'Tone inconsistency'
  | 'Terminology violation'
  | 'Incorrect or conflicting fact'
  | 'Unsupported promotional claim'
  | 'Messaging inconsistency'
  | 'Prohibited language'
  | 'Other guideline violation';

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type EvidenceStatus = 'verified_violation' | 'unsupported_claim' | 'potential_issue' | 'compliant';

export interface IFinding {
  _id?: mongoose.Types.ObjectId;
  category: FindingCategory;
  severity: FindingSeverity;
  originalText: string;
  explanation: string;
  supportingEvidence: string;
  suggestedCorrection: string;
  confidence: number;
  evidenceStatus: EvidenceStatus;
}

export type VisualFindingCategory =
  | 'Logo usage & placement'
  | 'Color palette consistency'
  | 'Typography inconsistency'
  | 'Visual layout & contrast'
  | 'Brand visual style violation'
  | 'Other visual issue';

export interface IVisualFinding {
  _id?: mongoose.Types.ObjectId;
  category: VisualFindingCategory;
  severity: FindingSeverity;
  element: string;
  explanation: string;
  supportingEvidence: string;
  recommendation: string;
  confidence: number;
  evidenceStatus: EvidenceStatus;
}

export interface IDetectedColor {
  hex: string;
  name?: string;
  percentage?: number;
  isApprovedBrandColor: boolean;
}

export interface IVisualAnalysisReport {
  overallVisualScore: number;
  detectedColors: IDetectedColor[];
  logoAnalysis: {
    detected: boolean;
    placement?: string;
    complianceStatus: 'compliant' | 'warning' | 'violation' | 'not_detected';
    details: string;
  };
  typographyAnalysis: {
    fontStyleDetected?: string;
    readabilityScore?: number;
    details: string;
  };
  visualFindings: IVisualFinding[];
}

export interface IAnalysisReport extends Document {
  submissionId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  analyzedContent: string;
  overallComplianceScore: number;
  status: 'passed' | 'warning' | 'violations_found';
  summary: string;
  findings: IFinding[];
  visualAnalysis?: IVisualAnalysisReport;
  retrievedChunkIds: mongoose.Types.ObjectId[];
  aiModelUsed: string;
  processingTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
}

const FindingSchema = new Schema<IFinding>(
  {
    category: {
      type: String,
      enum: [
        'Tone inconsistency',
        'Terminology violation',
        'Incorrect or conflicting fact',
        'Unsupported promotional claim',
        'Messaging inconsistency',
        'Prohibited language',
        'Other guideline violation',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      required: true,
    },
    originalText: { type: String, required: true },
    explanation: { type: String, required: true },
    supportingEvidence: { type: String, default: 'General brand compliance guideline' },
    suggestedCorrection: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.9 },
    evidenceStatus: {
      type: String,
      enum: ['verified_violation', 'unsupported_claim', 'potential_issue', 'compliant'],
      required: true,
    },
  },
  { _id: true }
);

const VisualFindingSchema = new Schema<IVisualFinding>(
  {
    category: {
      type: String,
      enum: [
        'Logo usage & placement',
        'Color palette consistency',
        'Typography inconsistency',
        'Visual layout & contrast',
        'Brand visual style violation',
        'Other visual issue',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      required: true,
    },
    element: { type: String, required: true },
    explanation: { type: String, required: true },
    supportingEvidence: { type: String, default: 'Brand visual guidelines' },
    recommendation: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.9 },
    evidenceStatus: {
      type: String,
      enum: ['verified_violation', 'unsupported_claim', 'potential_issue', 'compliant'],
      required: true,
    },
  },
  { _id: true }
);

const VisualAnalysisSchema = new Schema<IVisualAnalysisReport>(
  {
    overallVisualScore: { type: Number, min: 0, max: 100, required: true },
    detectedColors: [
      {
        hex: { type: String, required: true },
        name: { type: String },
        percentage: { type: Number },
        isApprovedBrandColor: { type: Boolean, default: false },
      },
    ],
    logoAnalysis: {
      detected: { type: Boolean, default: false },
      placement: { type: String },
      complianceStatus: {
        type: String,
        enum: ['compliant', 'warning', 'violation', 'not_detected'],
        default: 'not_detected',
      },
      details: { type: String, default: '' },
    },
    typographyAnalysis: {
      fontStyleDetected: { type: String },
      readabilityScore: { type: Number },
      details: { type: String, default: '' },
    },
    visualFindings: [VisualFindingSchema],
  },
  { _id: false }
);

const AnalysisReportSchema = new Schema<IAnalysisReport>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'ContentSubmission', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    analyzedContent: { type: String, required: true },
    overallComplianceScore: { type: Number, min: 0, max: 100, required: true },
    status: {
      type: String,
      enum: ['passed', 'warning', 'violations_found'],
      default: 'violations_found',
    },
    summary: { type: String, required: true },
    findings: [FindingSchema],
    visualAnalysis: { type: VisualAnalysisSchema },
    retrievedChunkIds: [{ type: Schema.Types.ObjectId, ref: 'GuidelineChunk' }],
    aiModelUsed: { type: String, default: 'gemini-3.8-flash' },
    processingTimeMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AnalysisReport = mongoose.model<IAnalysisReport>('AnalysisReport', AnalysisReportSchema);

