import mongoose, { Document, Schema } from 'mongoose';

export type FactType = 'fact' | 'approved_terminology' | 'prohibited_terminology' | 'tone_rule';

export interface IApprovedFact extends Document {
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  type: FactType;
  key: string;
  value: string;
  context?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovedFactSchema = new Schema<IApprovedFact>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['fact', 'approved_terminology', 'prohibited_terminology', 'tone_rule'],
      required: true,
      index: true,
    },
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    context: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ApprovedFactSchema.index({ organizationId: 1, type: 1, isActive: 1 });

export const ApprovedFact = mongoose.model<IApprovedFact>('ApprovedFact', ApprovedFactSchema);
