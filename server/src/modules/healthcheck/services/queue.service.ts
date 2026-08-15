import { Queue, Worker, type Job } from 'bullmq';
import { HealthCheckScheduler } from '../../../models/HealthCheckScheduler';
import { processHealthCheckJob } from './worker.service';

const QUEUE_NAME = 'health-checks';
const WORKER_NAME = 'health-check-worker';

let queue: Queue | null = null;
let worker: Worker | null = null;

const parseRedisUrl = (rawUrl: string) => {
  const url = new URL(rawUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    ...(url.username && url.username !== 'default'
      ? { username: decodeURIComponent(url.username) }
      : {}),
    ...(url.pathname && url.pathname !== '/' ? { db: Number(url.pathname.slice(1)) } : {}),
  };
};

const getQueue = (): Queue => {
  if (!queue) {
    const connection = parseRedisUrl(process.env.REDIS_URL || 'redis://localhost:6379');
    queue = new Queue(QUEUE_NAME, { connection });
  }
  return queue;
};

export async function startHealthCheckWorker(): Promise<void> {
  if (worker) return;

  const connection = parseRedisUrl(process.env.REDIS_URL || 'redis://localhost:6379');
  worker = new Worker(
    QUEUE_NAME,
    async (job: Job<{ loadBalancerId: string }>) => {
      await processHealthCheckJob(job.data.loadBalancerId);
    },
    {
      name: WORKER_NAME,
      connection,
      concurrency: Number(process.env.HEALTH_CHECK_CONCURRENCY || 10),
    }
  );

  worker.on('failed', (job, error) => {
    console.error(`Health check job ${job?.id} failed: ${error.message}`);
  });

  worker.on('ready', () => {
    console.log(`Health check worker started (queue: ${QUEUE_NAME})`);
  });
}

export async function resyncHealthCheckJobs(): Promise<void> {
  const schedulers = await HealthCheckScheduler.find({ enabled: true }).select({
    loadBalancerId: 1,
    intervalSeconds: 1,
  });

  for (const scheduler of schedulers) {
    try {
      await upsertHealthCheckJob(
        scheduler.loadBalancerId.toString(),
        scheduler.intervalSeconds
      );
    } catch (error: any) {
      console.error(
        `Health check resync failed for ${scheduler.loadBalancerId}: ${error.message}`
      );
    }
  }

  if (schedulers.length > 0) {
    console.log(`Health check resynced ${schedulers.length} scheduler(s)`);
  }
}

export async function upsertHealthCheckJob(
  loadBalancerId: string,
  intervalSeconds: number
): Promise<void> {
  const healthQueue = getQueue();
  const schedulerId = `lb:${loadBalancerId}`;

  await healthQueue.upsertJobScheduler(
    schedulerId,
    { every: intervalSeconds * 1000 },
    { name: schedulerId, data: { loadBalancerId } }
  );

  console.log(
    `Health check scheduled for ${loadBalancerId} every ${intervalSeconds}s`
  );
}

export async function removeHealthCheckJob(loadBalancerId: string): Promise<void> {
  const healthQueue = getQueue();
  const schedulerId = `lb:${loadBalancerId}`;

  try {
    await healthQueue.removeJobScheduler(schedulerId);
    console.log(`Health check scheduler removed for ${loadBalancerId}`);
  } catch {
    // Job already gone or Redis unavailable — the LB deletion must not fail.
  }
}

export async function enqueueImmediateHealthCheck(loadBalancerId: string): Promise<void> {
  const healthQueue = getQueue();
  await healthQueue.add(
    `lb-immediate:${loadBalancerId}`,
    { loadBalancerId },
    { jobId: `lb-immediate:${loadBalancerId}:${Date.now()}`, removeOnComplete: true, removeOnFail: true }
  );
}

export async function closeHealthCheckQueue(): Promise<void> {
  if (worker) {
    await worker.close().catch(() => {});
    worker = null;
  }
  if (queue) {
    await queue.close().catch(() => {});
    queue = null;
  }
}
