import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganisation extends Document {
  name: string;
  slug: string;
  description?: string;
  brandVoiceSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    brandVoiceSummary: { type: String, default: 'Professional, authentic, transparent, customer-first.' },
  },
  { timestamps: true }
);

export const Organisation = mongoose.model<IOrganisation>('Organisation', OrganisationSchema);
