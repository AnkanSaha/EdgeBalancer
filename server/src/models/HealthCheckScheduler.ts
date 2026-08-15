import mongoose, { Schema, Document } from 'mongoose';

export type OriginHealthStatus = 'healthy' | 'unhealthy' | 'provisioning' | 'disabled';

export interface IHealthCheckOrigin {
  url: string;
  healthPath: string;
  status: OriginHealthStatus;
  attempts: number;
  lastCheckedAt: Date | null;
  lastStatusCode: number | null;
  lastError: string | null;
  nextCheckAt: Date | null;
  disabledAt: Date | null;
}

export interface IHealthCheckScheduler extends Document {
  userId: mongoose.Types.ObjectId;
  loadBalancerId: mongoose.Types.ObjectId;
  intervalSeconds: number;
  enabled: boolean;
  origins: IHealthCheckOrigin[];
  createdAt: Date;
  updatedAt: Date;
}

const HealthCheckSchedulerSchema = new Schema<IHealthCheckScheduler>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    loadBalancerId: {
      type: Schema.Types.ObjectId,
      ref: 'LoadBalancer',
      required: [true, 'Load balancer ID is required'],
    },
    intervalSeconds: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
      max: 3600,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    origins: {
      type: [
        {
          url: { type: String, required: true },
          healthPath: { type: String, default: '/' },
          status: {
            type: String,
            enum: ['healthy', 'unhealthy', 'provisioning', 'disabled'],
            default: 'healthy',
          },
          attempts: { type: Number, default: 0 },
          lastCheckedAt: { type: Date, default: null },
          lastStatusCode: { type: Number, default: null },
          lastError: { type: String, default: null },
          nextCheckAt: { type: Date, default: null },
          disabledAt: { type: Date, default: null },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'healthcheckscheduler',
  }
);

HealthCheckSchedulerSchema.index({ loadBalancerId: 1 }, { unique: true });
HealthCheckSchedulerSchema.index({ userId: 1 });

export const HealthCheckScheduler = mongoose.model<IHealthCheckScheduler>(
  'HealthCheckScheduler',
  HealthCheckSchedulerSchema
);
