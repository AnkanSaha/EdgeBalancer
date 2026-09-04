import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../app';
import { connectTestDb, clearCollections, closeTestDb } from '../helpers/db';
import { createTestUser } from '../helpers/auth';
import { User } from '../../models/User';

const decodedToken = { email: '', name: 'GitHub User', uid: '', email_verified: false };

jest.mock('../../config/firebase', () => ({
  isFirebaseConfigured: () => true,
  verifyFirebaseToken: async () => decodedToken,
  initializeFirebaseAdmin: () => undefined,
}));

let app: FastifyInstance;

beforeAll(async () => {
  await connectTestDb();
  app = await buildServer();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await app.close();
  await closeTestDb();
});

// ─── Logout ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('200 and clears the auth cookie', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
    const setCookie = String(res.headers['set-cookie'] ?? '');
    // Clearing the cookie means setting it with an expired date
    expect(setCookie).toContain('token=');
    expect(setCookie.toLowerCase()).toContain('expires=');
  });
});

// ─── Me ──────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('200 returns user data when a valid cookie is provided', async () => {
    const { cookie } = await createTestUser({ email: 'me@example.com' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: cookie,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.user).toBeDefined();
    expect(body.data.user.password).toBeUndefined();
  });

  it('401 when no cookie is provided', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('401 when cookie contains an invalid JWT', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: 'token=this.is.not.valid' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Federated sign-in (Google + GitHub) ──────────────────────────────────────

describe('POST /api/auth/google', () => {
  afterEach(() => {
    decodedToken.email = '';
    decodedToken.uid = '';
    decodedToken.email_verified = false;
  });

  it('saves the email even when the provider reports it unverified (GitHub)', async () => {
    decodedToken.email = 'gh-user@example.com';
    decodedToken.uid = 'uid-gh-email';

    const res = await app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user.email).toBe('gh-user@example.com');

    const stored = await User.findOne({ firebaseUid: 'uid-gh-email' });
    expect(stored?.email).toBe('gh-user@example.com');
  });

  it('merges into an existing account even when the email is unverified, never creating a duplicate', async () => {
    const { user: existing } = await createTestUser({ email: 'taken@example.com' });
    decodedToken.email = 'taken@example.com';
    decodedToken.email_verified = false;
    decodedToken.uid = 'uid-gh-merge-by-email';

    const res = await app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user.id).toBe(existing._id.toString());

    const created = await User.findOne({ firebaseUid: 'uid-gh-merge-by-email' });
    expect(created).toBeNull();
  });

  it('merges into an existing account via a verified email', async () => {
    const { user: existing } = await createTestUser({ email: 'verified@example.com' });
    decodedToken.email = 'verified@example.com';
    decodedToken.email_verified = true;
    decodedToken.uid = 'uid-verified-merge';

    const res = await app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user.id).toBe(existing._id.toString());
  });
});
