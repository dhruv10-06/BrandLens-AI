import mongoose, { Document, Schema } from 'mongoose';

export type ContentType = 'social_media' | 'blog' | 'email' | 'advertisement' | 'press_release' | 'product_copy' | 'other';
export type SubmissionStatus = 'draft' | 'analysing' | 'needs_changes' | 'pending_review' | 'approved' | 'rejected';

export interface IContentSubmission extends Document {
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  title: string;
  contentType: ContentType;
  originalContent: string;
  currentContent: string;
  status: SubmissionStatus;
  latestAnalysisId?: mongoose.Types.ObjectId;
  version: number;
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
    originalContent: { type: String, required: true },
    currentContent: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'analysing', 'needs_changes', 'pending_review', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    latestAnalysisId: { type: Schema.Types.ObjectId, ref: 'AnalysisReport' },
    version: { type: Number, default: 1 },
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

