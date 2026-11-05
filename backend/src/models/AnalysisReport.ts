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

export interface IAnalysisReport extends Document {
  submissionId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  analyzedContent: string;
  overallComplianceScore: number;
  status: 'passed' | 'warning' | 'violations_found';
  summary: string;
  findings: IFinding[];
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
    retrievedChunkIds: [{ type: Schema.Types.ObjectId, ref: 'GuidelineChunk' }],
    aiModelUsed: { type: String, default: 'gemini-2.5-flash' },
    processingTimeMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AnalysisReport = mongoose.model<IAnalysisReport>('AnalysisReport', AnalysisReportSchema);

