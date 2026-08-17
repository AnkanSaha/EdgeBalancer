import mongoose, { Schema, Document } from 'mongoose';
import { WORKER_SCRIPT_NAME_REGEX } from '../utils/workerName';

export interface IOriginServer {
  url: string;
  weight: number;
  healthPath?: string;
  geoCities?: string[];
  geoSubdivisions?: string[];
  geoCountries?: string[];
  geoContinents?: string[];
  isFallback?: boolean;
}

export interface IIpOriginRecord {
  originalUrl: string;  // raw IP URL the user entered
  hostname: string;     // internal DNS hostname used in worker script
  dnsRecordId: string;  // Cloudflare DNS record ID
}

export interface IPlacementConfig {
  smartPlacement?: boolean;
  region?: string;
}

export interface IPathRoute {
  path: string;
  originIndex: number;
  priority: number;
}

export interface IPathRateLimit {
  path: string;
  requestsPerMinute: number;
  priority: number;
}

export interface ILoadBalancer extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  scriptName: string;
  domain: string;
  subdomain?: string;
  origins: IOriginServer[];
  strategy: string;
  weightedEnabled: boolean;
  exposeRealOrigin: boolean;
  corsEnabled: boolean;
  corsOrigins: string[];
  ipOriginRecords: IIpOriginRecord[];
  placement: IPlacementConfig;
  zoneId: string;
  status: 'active' | 'paused' | 'inactive';
  pauseMode?: 'release-domain' | 'keep-domain';
  healthCheckEnabled: boolean;
  healthCheckIntervalSeconds: number;
  healthAutoPaused: boolean;
  rateLimitEnabled: boolean;
  rateLimitRequestsPerMinute: number | null;
  pathRoutes: IPathRoute[];
  pathRateLimits: IPathRateLimit[];
  workerUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoadBalancerSchema = new Schema<ILoadBalancer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Load balancer name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      match: [WORKER_SCRIPT_NAME_REGEX, 'Name must use only lowercase letters, numbers, and hyphens'],
    },
    scriptName: {
      type: String,
      required: [true, 'Script name is required'],
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
    },
    subdomain: {
      type: String,
      default: null,
    },
    origins: {
      type: [
        {
          url: { type: String, required: true },
          weight: { type: Number, required: true, default: 1, min: 1 },
          healthPath: { type: String, default: '/' },
          geoCities: { type: [String], default: [] },
          geoSubdivisions: { type: [String], default: [] },
          geoCountries: { type: [String], default: [] },
          geoContinents: { type: [String], default: [] },
          isFallback: { type: Boolean, default: false },
        },
      ],
      required: [true, 'At least one origin server is required'],
      validate: {
        validator: (v: IOriginServer[]) => v.length > 0,
        message: 'At least one origin server is required',
      },
    },
    strategy: {
      type: String,
      required: [true, 'Strategy is required'],
      enum: ['round-robin', 'weighted-round-robin', 'ip-hash', 'cookie-sticky', 'weighted-cookie-sticky', 'failover', 'geo-steering'],
      default: 'round-robin',
    },
    weightedEnabled: {
      type: Boolean,
      default: false,
    },
    exposeRealOrigin: {
      type: Boolean,
      default: false,
    },
    corsEnabled: {
      type: Boolean,
      default: false,
    },
    corsOrigins: {
      type: [String],
      default: [],
    },
    ipOriginRecords: {
      type: [
        {
          originalUrl: { type: String, required: true },
          hostname: { type: String, required: true },
          dnsRecordId: { type: String, required: true },
        },
      ],
      default: [],
    },
    placement: {
      type: {
        smartPlacement: { type: Boolean, default: true },
        region: { type: String, default: null },
      },
      default: { smartPlacement: true },
    },
    zoneId: {
      type: String,
      required: [true, 'Zone ID is required'],
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'inactive'],
      default: 'active',
    },
    pauseMode: {
      type: String,
      enum: ['release-domain', 'keep-domain'],
      default: null,
    },
    healthCheckEnabled: {
      type: Boolean,
      default: false,
    },
    healthCheckIntervalSeconds: {
      type: Number,
      default: 30,
    },
    healthAutoPaused: {
      type: Boolean,
      default: false,
    },
    rateLimitEnabled: {
      type: Boolean,
      default: false,
    },
    rateLimitRequestsPerMinute: {
      type: Number,
      default: null,
      min: 1,
      max: 100000,
    },
    pathRoutes: {
      type: [
        {
          path: { type: String, required: true },
          originIndex: { type: Number, required: true, min: 0 },
          priority: { type: Number, required: true, min: 1 },
        },
      ],
      default: [],
    },
    pathRateLimits: {
      type: [
        {
          path: { type: String, required: true },
          requestsPerMinute: { type: Number, required: true, min: 1, max: 100000 },
          priority: { type: Number, required: true, min: 1 },
        },
      ],
      default: [],
    },
    workerUrl: {
      type: String,
      required: [true, 'Worker URL is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance on userId queries
LoadBalancerSchema.index({ userId: 1 });

// Worker script names only have to be unique within a Cloudflare account, and each account
// belongs to one user. A globally unique scriptName wrongly rejected a name simply because an
// unrelated user had already taken it.
//
// MIGRATION: Mongo does not drop the old global index on its own. Run once against each
// environment before deploying:  db.loadbalancers.dropIndex('scriptName_1')
LoadBalancerSchema.index({ userId: 1, scriptName: 1 }, { unique: true });

export const LoadBalancer = mongoose.model<ILoadBalancer>('LoadBalancer', LoadBalancerSchema);