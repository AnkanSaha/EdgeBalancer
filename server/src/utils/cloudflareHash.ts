import crypto from 'crypto';
import { User } from '../models/User';

const ACCOUNT_LINKED_MESSAGE = 'This Cloudflare account is already linked to another EdgeBalancer account';

export const hashCloudflareAccountId = (accountId: string): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  }
  return crypto.createHmac('sha256', Buffer.from(key, 'hex')).update(accountId).digest('hex');
};

export class CloudflareAccountAlreadyLinkedError extends Error {
  statusCode = 409;

  constructor() {
    super(ACCOUNT_LINKED_MESSAGE);
    this.name = 'CloudflareAccountAlreadyLinkedError';
  }
}

export const assertCloudflareAccountAvailable = async (
  accountId: string,
  ownerUserId: string
): Promise<string> => {
  const hash = hashCloudflareAccountId(accountId);
  const existing = await User.findOne({ cloudflareAccountHash: hash, _id: { $ne: ownerUserId } })
    .select('_id')
    .lean();

  if (existing) {
    throw new CloudflareAccountAlreadyLinkedError();
  }

  return hash;
};

export const isDuplicateKeyError = (error: unknown): boolean =>
  (error as { code?: number })?.code === 11000;