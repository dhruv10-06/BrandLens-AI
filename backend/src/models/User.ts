import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'creator' | 'reviewer' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['creator', 'reviewer', 'admin'], default: 'creator', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

