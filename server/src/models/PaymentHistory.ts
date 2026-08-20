import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';

export interface IPaymentHistory extends Document {
  userId: Types.ObjectId;
  orderId: string;
  cfOrderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  plan: string;
  paymentMethod?: string;
  cfPaymentId?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentHistorySchema = new Schema<IPaymentHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    cfOrderId: {
      type: String,
      default: null,
    },
    paymentSessionId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'],
      default: 'PENDING',
    },
    plan: {
      type: String,
      enum: ['trial', 'student', 'pro'],
      required: true,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    cfPaymentId: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

PaymentHistorySchema.index({ userId: 1, createdAt: -1 });

export const PaymentHistory = mongoose.model<IPaymentHistory>('PaymentHistory', PaymentHistorySchema);
