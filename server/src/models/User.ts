import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password?: string | null;
  googleId?: string | null;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  cloudflareAccountIdIv?: string;
  cloudflareTokenIv?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
      validate: {
        validator(value: string | null | undefined) {
          if (!value) {
            return true;
          }

          return value.length >= 8;
        },
        message: 'Password must be at least 8 characters',
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    cloudflareAccountId: {
      type: String,
      default: null,
    },
    cloudflareApiToken: {
      type: String,
      default: null,
    },
    cloudflareAccountIdIv: {
      type: String,
      default: null,
    },
    cloudflareTokenIv: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Note: Indexes are already created by 'unique: true' on email and username fields
// No need for explicit schema.index() calls to avoid duplicate index warnings

export const User = mongoose.model<IUser>('User', UserSchema);
