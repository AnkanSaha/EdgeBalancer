import { readFileSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { normalizeWorkerScriptName } from '../utils/workerName';

export interface OriginServer {
  url: string;
  weight: number;
  geoCountries?: string[];
  geoColos?: string[];
  geoContinents?: string[];
}

export type WorkerStrategy =
  | 'round-robin'
  | 'weighted-round-robin'
  | 'ip-hash'
  | 'cookie-sticky'
  | 'weighted-cookie-sticky'
  | 'failover'
  | 'geo-steering'
  | 'paused';

export interface WorkerConfig {
  origins: OriginServer[];
  strategy: WorkerStrategy;
}

const TEMPLATE_MAP: Record<WorkerStrategy, string> = {
  'round-robin': 'roundRobin.js',
  'weighted-round-robin': 'weightedRoundRobin.js',
  'ip-hash': 'ipHash.js',
  'cookie-sticky': 'cookieSticky.js',
  'weighted-cookie-sticky': 'weightedCookieSticky.js',
  'failover': 'failover.js',
  'geo-steering': 'geoSteering.js',
  'paused': 'paused.js',
};

const TEMPLATE_DIR = path.join(__dirname, 'workerTemplates');

const getTemplateContents = (strategy: WorkerStrategy) => {
  return readFileSync(path.join(TEMPLATE_DIR, TEMPLATE_MAP[strategy]), 'utf8');
};

const toWorkerOrigin = (origin: OriginServer, index: number) => ({
  id: `origin_${index}_${createHash('sha1').update(origin.url.trim().toLowerCase()).digest('hex').slice(0, 12)}`,
  url: origin.url.trim(),
  weight: origin.weight,
  geoCountries: Array.isArray(origin.geoCountries) ? origin.geoCountries : [],
  geoColos: Array.isArray(origin.geoColos) ? origin.geoColos : [],
  geoContinents: Array.isArray(origin.geoContinents) ? origin.geoContinents : [],
});

export const generateWorkerCode = (config: WorkerConfig): string => {
  const template = getTemplateContents(config.strategy);
  const workerConfig = {
    origins: config.origins.map(toWorkerOrigin),
    stickyCookieName: 'edgebalancer_origin',
    stickyMaxAge: 86400,
  };

  return template.replace('__CONFIG__', JSON.stringify(workerConfig, null, 2));
};

export const generateScriptName = (name: string): string => {
  return normalizeWorkerScriptName(name);
};
