import mongoose, { Schema, Document } from 'mongoose';

export interface IModelAttempt {
  provider: string;
  model: string;
  ok: boolean;
  error: string | null;
}

export interface IAiToolCall {
  name: string;
  args: Record<string, unknown>;
  result: string;
  ok: boolean;
  durationMs: number;
}

export interface IAiRun extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  modelsUsed: IModelAttempt[];
  finalModel: string | null;
  toolCalls: IAiToolCall[];
  outcome: 'success' | 'failure' | 'pending' | 'refused';
  durationMs: number;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ModelAttemptSchema = new Schema<IModelAttempt>(
  {
    provider: { type: String, required: true },
    model: { type: String, required: true },
    ok: { type: Boolean, required: true },
    error: { type: String, default: null },
  },
  { _id: false },
);

const AiToolCallSchema = new Schema<IAiToolCall>(
  {
    name: { type: String, required: true },
    args: { type: Schema.Types.Mixed, default: {} },
    result: { type: String, default: '' },
    ok: { type: Boolean, required: true },
    durationMs: { type: Number, required: true },
  },
  { _id: false },
);

const AiRunSchema = new Schema<IAiRun>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
    },
    modelsUsed: {
      type: [ModelAttemptSchema],
      default: [],
    },
    finalModel: {
      type: String,
      default: null,
    },
    toolCalls: {
      type: [AiToolCallSchema],
      default: [],
    },
    outcome: {
      type: String,
      enum: ['success', 'failure', 'pending', 'refused'],
      required: true,
    },
    durationMs: {
      type: Number,
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

AiRunSchema.index({ userId: 1, createdAt: -1 });

export const AiRun = mongoose.model<IAiRun>('AiRun', AiRunSchema);
