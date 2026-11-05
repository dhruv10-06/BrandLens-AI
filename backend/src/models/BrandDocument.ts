import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  fileType: 'pdf' | 'txt';
  fileSize: number;
  extractedText: string;
  chunkCount: number;
  status: 'processing' | 'processed' | 'failed';
  errorMessage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandDocumentSchema = new Schema<IBrandDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'txt'], required: true },
    fileSize: { type: Number, required: true },
    extractedText: { type: String, default: '' },
    chunkCount: { type: Number, default: 0 },
    status: { type: String, enum: ['processing', 'processed', 'failed'], default: 'processing', index: true },
    errorMessage: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const BrandDocument = mongoose.model<IBrandDocument>('BrandDocument', BrandDocumentSchema);
