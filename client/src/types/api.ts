// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email?: string | null;
  username: string;
  hasCloudflareCredentials: boolean;
  cloudflareAccountId?: string; // masked
  cloudflareApiToken?: string; // masked
}

// Cloudflare types
export interface CloudflareCredentials {
  accountId: string;
  apiToken: string;
}

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
}

// Load Balancer types
export interface OriginServer {
  url: string;
  weight: number;
  geoCities?: string[];
  geoSubdivisions?: string[];
  geoCountries?: string[];
  geoContinents?: string[];
  isFallback?: boolean;
}

export interface IpOriginRecord {
  originalUrl: string;
  hostname: string;
  dnsRecordId: string;
}

export interface PlacementConfig {
  smartPlacement?: boolean;
  region?: string;
}

export type LoadBalancerStrategy =
  | 'round-robin'
  | 'weighted-round-robin'
  | 'ip-hash'
  | 'cookie-sticky'
  | 'weighted-cookie-sticky'
  | 'failover'
  | 'geo-steering';

export interface LoadBalancer {
  id: string;
  name: string;
  scriptName: string;
  domain: string;
  subdomain?: string | null;
  fullDomain: string;
  zoneId: string;
  origins: OriginServer[];
  originCount?: number;
  strategy: string;
  strategyValue: LoadBalancerStrategy;
  weightedEnabled: boolean;
  exposeRealOrigin: boolean;
  corsEnabled: boolean;
  corsOrigins: string[];
  ipOriginRecords: IpOriginRecord[];
  placement: PlacementConfig;
  status: string;
  workerUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  _id: string;
  loadBalancerName: string;
  domain: string;
  subdomain: string | null;
  strategy: string;
  actionType: 'create' | 'edit';
  isActive: boolean;
  loadBalancerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionsResponse {
  sessions: Session[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface LoadBalancerAnalytics {
  requests: number;
  errors: number;
  errorRate: number;
}

export interface CreateLoadBalancerRequest {
  name: string;
  zoneId: string;
  domain: string;
  subdomain?: string;
  origins: OriginServer[];
  strategy: LoadBalancerStrategy;
  weightedEnabled: boolean;
  exposeRealOrigin: boolean;
  corsEnabled: boolean;
  corsOrigins: string[];
  placement: PlacementConfig;
}

// --- AI provisioning ---

export type AiOutcome = 'success' | 'failure' | 'pending' | 'refused';

export type PendingActionKind = 'delete' | 'pause' | 'resume' | 'update';

/** A destructive step the agent resolved but did not perform — the user confirms it. */
export interface PendingAction {
  action: PendingActionKind;
  loadBalancerId: string;
  name: string;
  fullDomain: string;
  summary: string;
  payload?: Record<string, unknown>;
}

export type AiEvent =
  | { name: 'run_start'; payload: { runId: string } }
  | { name: 'model_switch'; payload: { from: string; to: string; reason: string } }
  | { name: 'status'; payload: { message: string; progress: number } }
  | { name: 'tool_start'; payload: { name: string; args: Record<string, unknown> } }
  | { name: 'tool_result'; payload: { name: string; ok: boolean; summary: string } }
  | { name: 'done'; payload: { outcome: AiOutcome; message: string; loadBalancers: LoadBalancer[]; pendingAction: PendingAction | null } }
  | { name: 'error'; payload: { message: string } };

export interface AiStep {
  label: string;
  state: 'running' | 'ok' | 'failed';
  detail?: string;
}
