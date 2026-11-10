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

export type VisualFindingCategory =
  | 'Logo usage & placement'
  | 'Color palette consistency'
  | 'Typography inconsistency'
  | 'Visual layout & contrast'
  | 'Brand visual style violation'
  | 'Other visual issue';

export interface VisualFinding {
  _id?: string;
  category: VisualFindingCategory;
  severity: FindingSeverity;
  element: string;
  explanation: string;
  supportingEvidence: string;
  recommendation: string;
  confidence: number;
  evidenceStatus: EvidenceStatus;
}

export interface DetectedColor {
  hex: string;
  name?: string;
  percentage?: number;
  isApprovedBrandColor: boolean;
}

export interface VisualAnalysisReport {
  overallVisualScore: number;
  detectedColors: DetectedColor[];
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
  visualFindings: VisualFinding[];
}

export interface AnalysisReport {
  _id: string;
  submissionId: string;
  overallComplianceScore: number;
  status: 'passed' | 'warning' | 'violations_found';
  summary: string;
  findings: Finding[];
  visualAnalysis?: VisualAnalysisReport;
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

export type SubmissionFormat = 'text' | 'document' | 'image' | 'multi_format';

export interface VisualAsset {
  filename: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
}

export interface PublishingDetails {
  channel?: 'webhook' | 'cms' | 'social_media' | 'internal';
  webhookUrl?: string;
  status: 'not_published' | 'published' | 'failed';
  publishedAt?: string;
  payloadPreview?: string;
  error?: string;
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
  submissionFormat?: SubmissionFormat;
  originalContent: string;
  currentContent: string;
  visualAsset?: VisualAsset;
  status: SubmissionStatus;
  latestAnalysisId?: AnalysisReport;
  version: number;
  publishingDetails?: PublishingDetails;
  contentHistory: Array<{
    content: string;
    modifiedAt: string;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceMetrics {
  kpis: {
    totalSubmissions: number;
    averageComplianceScore: number;
    averageVisualScore: number;
    approvalRate: number;
    totalViolationsDetected: number;
    criticalViolationsCount: number;
    guidelinesIndexedCount: number;
    verifiedFactsCount: number;
  };
  statusDistribution: {
    approved: number;
    rejected: number;
    needs_changes: number;
    pending_review: number;
    draft: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  severityBreakdown: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  visualMetrics: {
    totalVisualAssets: number;
    averageVisualScore: number;
    logoViolationCount: number;
    colorViolationCount: number;
    typographyViolationCount: number;
  };
  recurringViolations: Array<{
    phraseOrRule: string;
    category: string;
    occurrences: number;
    severity: string;
    lastDetectedAt: string;
    sampleContext: string;
  }>;
  guidelineGaps: Array<{
    topicOrClaim: string;
    frequency: number;
    recommendation: string;
    sampleText: string;
  }>;
  timelineTrend: Array<{
    date: string;
    submissionsCount: number;
    averageScore: number;
  }>;
  policyRecommendations: Array<{
    priority: 'Urgent' | 'High' | 'Medium' | 'Informational';
    area: string;
    title: string;
    description: string;
    impact: string;
  }>;
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

