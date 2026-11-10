import mongoose, { Document, Schema } from 'mongoose';

export type ContentType = 'social_media' | 'blog' | 'email' | 'advertisement' | 'press_release' | 'product_copy' | 'other';
export type SubmissionFormat = 'text' | 'document' | 'image' | 'multi_format';
export type SubmissionStatus = 'draft' | 'analysing' | 'needs_changes' | 'pending_review' | 'approved' | 'rejected';

export interface IVisualAsset {
  filename: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
}

export interface IPublishingDetails {
  channel?: 'webhook' | 'cms' | 'social_media' | 'internal';
  webhookUrl?: string;
  status: 'not_published' | 'published' | 'failed';
  publishedAt?: Date;
  payloadPreview?: string;
  error?: string;
}

export interface IContentSubmission extends Document {
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  title: string;
  contentType: ContentType;
  submissionFormat: SubmissionFormat;
  originalContent: string;
  currentContent: string;
  visualAsset?: IVisualAsset;
  status: SubmissionStatus;
  latestAnalysisId?: mongoose.Types.ObjectId;
  version: number;
  publishingDetails?: IPublishingDetails;
  contentHistory: Array<{
    content: string;
    modifiedAt: Date;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSubmissionSchema = new Schema<IContentSubmission>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      enum: ['social_media', 'blog', 'email', 'advertisement', 'press_release', 'product_copy', 'other'],
      default: 'social_media',
      required: true,
    },
    submissionFormat: {
      type: String,
      enum: ['text', 'document', 'image', 'multi_format'],
      default: 'text',
      required: true,
    },
    originalContent: { type: String, required: true },
    currentContent: { type: String, required: true },
    visualAsset: {
      filename: { type: String },
      fileType: { type: String },
      fileSize: { type: Number },
      dataUrl: { type: String },
      dimensions: {
        width: { type: Number },
        height: { type: Number },
      },
    },
    status: {
      type: String,
      enum: ['draft', 'analysing', 'needs_changes', 'pending_review', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    latestAnalysisId: { type: Schema.Types.ObjectId, ref: 'AnalysisReport' },
    version: { type: Number, default: 1 },
    publishingDetails: {
      channel: {
        type: String,
        enum: ['webhook', 'cms', 'social_media', 'internal'],
        default: 'internal',
      },
      webhookUrl: { type: String },
      status: {
        type: String,
        enum: ['not_published', 'published', 'failed'],
        default: 'not_published',
      },
      publishedAt: { type: Date },
      payloadPreview: { type: String },
      error: { type: String },
    },
    contentHistory: [
      {
        content: { type: String, required: true },
        modifiedAt: { type: Date, default: Date.now },
        reason: { type: String },
      },
    ],
  },
  { timestamps: true }
);

ContentSubmissionSchema.index({ organizationId: 1, status: 1 });

export const ContentSubmission = mongoose.model<IContentSubmission>('ContentSubmission', ContentSubmissionSchema);

