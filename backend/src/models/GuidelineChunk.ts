import mongoose, { Document, Schema } from 'mongoose';

export interface IGuidelineChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: {
    title: string;
    category?: string;
    pageNumber?: number;
    charCount?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GuidelineChunkSchema = new Schema<IGuidelineChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'BrandDocument', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    metadata: {
      title: { type: String, default: '' },
      category: { type: String, default: 'General' },
      pageNumber: { type: Number },
      charCount: { type: Number },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Compound index for querying active chunks by org
GuidelineChunkSchema.index({ organizationId: 1, isActive: 1 });

export const GuidelineChunk = mongoose.model<IGuidelineChunk>('GuidelineChunk', GuidelineChunkSchema);

