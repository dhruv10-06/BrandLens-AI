import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganisation extends Document {
  name: string;
  slug: string;
  description?: string;
  brandVoiceSummary?: string;
  brandVisualRules?: {
    primaryColors?: string[];
    secondaryColors?: string[];
    prohibitedColors?: string[];
    logoGuidelines?: string;
    typographyRules?: string;
  };
  publishingWebhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    brandVoiceSummary: { type: String, default: 'Professional, authentic, transparent, customer-first.' },
    brandVisualRules: {
      primaryColors: { type: [String], default: ['#4F46E5', '#0F172A', '#FFFFFF'] },
      secondaryColors: { type: [String], default: ['#10B981', '#6366F1', '#94A3B8'] },
      prohibitedColors: { type: [String], default: ['#FF1493', '#FFFF00'] },
      logoGuidelines: {
        type: String,
        default: 'ApexFlow logo must remain unrotated with clear padding. Place in top-left or centered. Avoid neon background clashes.',
      },
      typographyRules: {
        type: String,
        default: 'Clean modern sans-serif (Inter, Plus Jakarta Sans, SF Pro). Avoid informal comic or decorative scripts.',
      },
    },
    publishingWebhookUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Organisation = mongoose.model<IOrganisation>('Organisation', OrganisationSchema);

