export type UserRole = 'creator' | 'reviewer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: {
    id: string;
    name: string;
    slug: string;
    brandVoiceSummary?: string;
  };
}

export interface Organisation {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  brandVoiceSummary?: string;
  createdAt: string;
}

export interface BrandDocument {
  _id: string;
  filename: string;
  originalName: string;
  fileType: 'pdf' | 'txt';
  fileSize: number;
  chunkCount: number;
  status: 'processing' | 'processed' | 'failed';
  errorMessage?: string;
  isActive: boolean;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

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

export interface Finding {
  _id?: string;
  category: FindingCategory;
  severity: FindingSeverity;
  originalText: string;
  explanation: string;
  supportingEvidence: string;
  suggestedCorrection: string;
  confidence: number;
  evidenceStatus: EvidenceStatus;
}

export interface AnalysisReport {
  _id: string;
  submissionId: string;
  overallComplianceScore: number;
  status: 'passed' | 'warning' | 'violations_found';
  summary: string;
  findings: Finding[];
  retrievedChunkIds?: Array<{
    _id: string;
    chunkIndex: number;
    content: string;
    metadata?: {
      title?: string;
      category?: string;
    };
  }>;
  aiModelUsed: string;
  createdAt: string;
}

export type ContentType =
  | 'social_media'
  | 'blog'
  | 'email'
  | 'advertisement'
  | 'press_release'
  | 'product_copy'
  | 'other';

export type SubmissionStatus =
  | 'draft'
  | 'analysing'
  | 'needs_changes'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export interface ContentSubmission {
  _id: string;
  organizationId: string;
  creatorId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  title: string;
  contentType: ContentType;
  originalContent: string;
  currentContent: string;
  status: SubmissionStatus;
  latestAnalysisId?: AnalysisReport;
  version: number;
  contentHistory: Array<{
    content: string;
    modifiedAt: string;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDecision {
  _id: string;
  submissionId: {
    _id: string;
    title: string;
    contentType: ContentType;
    status: SubmissionStatus;
  };
  reviewerId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  decision: 'approved' | 'rejected' | 'requested_changes';
  comments: string;
  reviewedContent: string;
  createdAt: string;
}

export interface ApprovedFact {
  _id: string;
  type: 'fact' | 'approved_terminology' | 'prohibited_terminology' | 'tone_rule';
  key: string;
  value: string;
  context?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
}

