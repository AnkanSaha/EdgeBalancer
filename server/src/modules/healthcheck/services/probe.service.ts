import axios from 'axios';

export interface ProbeTarget {
  url: string;
  healthPath: string;
}

export interface ProbeResult {
  statusCode: number | null;
  error: string | null;
}

const PROBE_TIMEOUT_MS = Number(process.env.HEALTH_CHECK_PROBE_TIMEOUT_MS || 5000);

const buildProbeUrl = (origin: ProbeTarget): string => {
  const path = origin.healthPath?.trim() || '/';
  return new URL(path, origin.url).toString();
};

export const probeOrigin = async (origin: ProbeTarget): Promise<ProbeResult> => {
  try {
    const response = await axios.get(buildProbeUrl(origin), {
      timeout: PROBE_TIMEOUT_MS,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'EdgeBalancer-HealthCheck/1.0',
      },
    });

    return { statusCode: response.status, error: null };
  } catch (error: any) {
    return {
      statusCode: null,
      error: error.message || 'Origin unreachable',
    };
  }
};

export const isHealthyStatus = (statusCode: number | null): boolean =>
  statusCode !== null && statusCode >= 200 && statusCode < 400;
