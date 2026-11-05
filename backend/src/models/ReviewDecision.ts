import mongoose, { Document, Schema } from 'mongoose';

export type ReviewDecisionType = 'approved' | 'rejected' | 'requested_changes';

export interface IReviewDecision extends Document {
  submissionId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  decision: ReviewDecisionType;
  comments: string;
  reviewedContent: string;
  createdAt: Date;
}

const ReviewDecisionSchema = new Schema<IReviewDecision>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'ContentSubmission', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'requested_changes'],
      required: true,
    },
    comments: { type: String, default: '' },
    reviewedContent: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ReviewDecision = mongoose.model<IReviewDecision>('ReviewDecision', ReviewDecisionSchema);

