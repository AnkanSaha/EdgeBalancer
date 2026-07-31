// The shared redisMock always returns 'OK' from set(), which would make the single-use code guard
// invisible. This local mock honours NX so replay is actually observable.
const lockStore = new Map<string, string>();

jest.mock('../../utils/redisClient', () => {
  const slots = new Map<string, number>();

  const client = {
    get: async () => null,
    set: async (key: string, value: string, opts?: { NX?: boolean }) => {
      if (opts?.NX && lockStore.has(key)) return null;
      lockStore.set(key, value);
      return 'OK';
    },
    exists: async () => 0,
    del: async () => 1,
    scriptLoad: async () => 'test-sha',
    eval: async () => 1,
    evalSha: async (_sha: string, opts: { keys: string[]; arguments: string[] }) => {
      const window = Number(opts.arguments[0]);
      const now = Date.now();
      const slotKey = `${opts.keys[0]}:${Math.floor(now / window)}`;
      const current = (slots.get(slotKey) ?? 0) + 1;
      slots.set(slotKey, current);
      return [current, window - (now % window)];
    },
  };

  return { getRedisClient: async () => client, closeRedisClient: async () => undefined };
});

const decodedGoogleToken = { email: '', name: 'Test User', uid: '', email_verified: true };

jest.mock('../../config/firebase', () => ({
  isFirebaseConfigured: () => true,
  verifyFirebaseToken: async () => decodedGoogleToken,
  initializeFirebaseAdmin: () => undefined,
}));

import type { FastifyInstance } from 'fastify';
import { Secret, TOTP } from 'otpauth';
import { buildServer } from '../../app';
import { User } from '../../models/User';
import { connectTestDb, clearCollections, closeTestDb } from '../helpers/db';
import { createTestUser } from '../helpers/auth';

let app: FastifyInstance;

beforeAll(async () => {
  await connectTestDb();
  app = await buildServer();
});

afterEach(async () => {
  await clearCollections();
  lockStore.clear();
});

afterAll(async () => {
  await app.close();
  await closeTestDb();
});

// Codes are single-use, so enrolment spends the next step's code (still inside the drift window)
// and leaves the current one for the assertion that follows.
const codeFor = (secret: string, offsetMs = 0) =>
  new TOTP({ secret: Secret.fromBase32(secret) }).generate({ timestamp: Date.now() + offsetMs });

const STEP_MS = 30_000;

const setCookies = (res: { headers: Record<string, unknown> }): string[] => {
  const raw = res.headers['set-cookie'];
  return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
};

/** Runs a full enrolment and returns the device's base32 secret and id. */
async function enrol(cookie: Record<string, string>, name = 'iPhone') {
  const setup = await app.inject({ method: 'POST', url: '/api/auth/2fa/setup', headers: cookie, payload: { name } });
  expect(setup.statusCode).toBe(200);

  const { deviceId, secret, qrDataUrl } = setup.json().data;

  const confirm = await app.inject({
    method: 'POST',
    url: '/api/auth/2fa/confirm',
    headers: cookie,
    payload: { deviceId, code: codeFor(secret, STEP_MS) },
  });
  expect(confirm.statusCode).toBe(200);

  return { deviceId, secret, qrDataUrl };
}

describe('TOTP enrolment', () => {
  it('setup returns a scannable QR and confirm turns two-factor on', async () => {
    const { cookie } = await createTestUser();

    const { qrDataUrl } = await enrol(cookie);
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: cookie });
    expect(me.json().data.user.totpEnabled).toBe(true);
    expect(me.json().data.user.totpDevices).toHaveLength(1);
  });

  it('keeps the name the user chose', async () => {
    const { cookie } = await createTestUser();
    await enrol(cookie, '  1Password  ');

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: cookie });
    expect(me.json().data.user.totpDevices[0].name).toBe('1Password');
  });

  it('rejects a blank or oversized name', async () => {
    const { cookie } = await createTestUser();

    for (const name of ['   ', 'x'.repeat(31)]) {
      const res = await app.inject({ method: 'POST', url: '/api/auth/2fa/setup', headers: cookie, payload: { name } });
      expect(res.statusCode).toBe(400);
    }
  });

  it('never returns a stored secret after enrolment', async () => {
    const { cookie } = await createTestUser();
    await enrol(cookie);

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: cookie });
    expect(JSON.stringify(me.json())).not.toContain('secret');
  });

  it('rejects a wrong code and leaves two-factor off', async () => {
    const { cookie } = await createTestUser();
    const setup = await app.inject({ method: 'POST', url: '/api/auth/2fa/setup', headers: cookie, payload: {} });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/2fa/confirm',
      headers: cookie,
      payload: { deviceId: setup.json().data.deviceId, code: '000000' },
    });
    expect(res.statusCode).toBe(400);

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: cookie });
    expect(me.json().data.user.totpEnabled).toBe(false);
  });

  it('enrols any number of apps', async () => {
    const { cookie } = await createTestUser();
    for (const name of ['iPhone', 'iPad', 'Authy', 'Laptop', '1Password']) {
      await enrol(cookie, name);
    }

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: cookie });
    expect(me.json().data.user.totpDevices.map((d: { name: string }) => d.name)).toEqual([
      'iPhone', 'iPad', 'Authy', 'Laptop', '1Password',
    ]);
  });

  it('an abandoned setup does not permanently consume a slot', async () => {
    const { cookie, user } = await createTestUser();
    await app.inject({ method: 'POST', url: '/api/auth/2fa/setup', headers: cookie, payload: {} });
    await app.inject({ method: 'POST', url: '/api/auth/2fa/setup', headers: cookie, payload: {} });

    const stored = await User.findById(user._id);
    expect(stored!.totpDevices).toHaveLength(1);
  });
});

describe('POST /api/auth/google with two-factor on', () => {
  it('returns a challenge instead of a session', async () => {
    const { user, cookie } = await createTestUser({ firebaseUid: 'uid-2fa' });
    await enrol(cookie);

    decodedGoogleToken.email = user.email!;
    decodedGoogleToken.uid = 'uid-2fa';

    const res = await app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.totpRequired).toBe(true);
    expect(res.json().data.user).toBeUndefined();

    const cookies = setCookies(res);
    expect(cookies.some((c) => c.startsWith('eb_2fa='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('token='))).toBe(false);
  });

  it('still issues a session directly when no device is enrolled', async () => {
    const { user } = await createTestUser({ firebaseUid: 'uid-plain' });
    decodedGoogleToken.email = user.email!;
    decodedGoogleToken.uid = 'uid-plain';

    const res = await app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });

    expect(res.json().data.user).toBeDefined();
    expect(setCookies(res).some((c) => c.startsWith('token='))).toBe(true);
  });
});

describe('POST /api/auth/2fa/verify', () => {
  const challengeFrom = (res: { headers: Record<string, unknown> }) => {
    const raw = setCookies(res).find((c) => c.startsWith('eb_2fa='))!;
    return raw.split(';')[0].slice('eb_2fa='.length);
  };

  async function startChallenge() {
    const { user, cookie } = await createTestUser({ firebaseUid: 'uid-verify' });
    const device = await enrol(cookie);

    decodedGoogleToken.email = user.email!;
    decodedGoogleToken.uid = 'uid-verify';

    const login = await app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });
    return { challenge: challengeFrom(login), device, cookie };
  }

  it('a valid code exchanges the challenge for a session', async () => {
    const { challenge, device } = await startChallenge();

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/2fa/verify',
      headers: { cookie: `eb_2fa=${challenge}` },
      payload: { code: codeFor(device.secret) },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.user).toBeDefined();
    expect(setCookies(res).some((c) => c.startsWith('token='))).toBe(true);
  });

  it('the same code cannot be replayed', async () => {
    const { challenge, device } = await startChallenge();
    const code = codeFor(device.secret);

    await app.inject({
      method: 'POST', url: '/api/auth/2fa/verify',
      headers: { cookie: `eb_2fa=${challenge}` }, payload: { code },
    });

    const replay = await app.inject({
      method: 'POST', url: '/api/auth/2fa/verify',
      headers: { cookie: `eb_2fa=${challenge}` }, payload: { code },
    });

    expect(replay.statusCode).toBe(401);
  });

  it('a code from a second app satisfies the challenge', async () => {
    const { user, cookie } = await createTestUser({ firebaseUid: 'uid-multi' });
    await enrol(cookie);
    const backup = await enrol(cookie);

    decodedGoogleToken.email = user.email!;
    decodedGoogleToken.uid = 'uid-multi';
    const login = await app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/2fa/verify',
      headers: { cookie: `eb_2fa=${challengeFrom(login)}` },
      payload: { code: codeFor(backup.secret) },
    });

    expect(res.statusCode).toBe(200);
  });

  it('401 without a challenge cookie', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/2fa/verify', payload: { code: '123456' } });
    expect(res.statusCode).toBe(401);
  });

  it('the challenge token cannot be used as a session cookie', async () => {
    const { challenge } = await startChallenge();

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: `token=${challenge}` },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/2fa/remove', () => {
  it('removes a lost device using a code from another one', async () => {
    const { cookie } = await createTestUser();
    const lost = await enrol(cookie);
    const backup = await enrol(cookie);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/2fa/remove',
      headers: cookie,
      payload: { deviceId: lost.deviceId, code: codeFor(backup.secret) },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.user.totpDevices).toHaveLength(1);
    expect(res.json().data.user.totpEnabled).toBe(true);
  });

  it('refuses the target device own code while another device remains', async () => {
    const { cookie } = await createTestUser();
    const lost = await enrol(cookie);
    await enrol(cookie);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/2fa/remove',
      headers: cookie,
      payload: { deviceId: lost.deviceId, code: codeFor(lost.secret) },
    });

    expect(res.statusCode).toBe(400);
  });

  it('the last device is removed with its own code and turns two-factor off', async () => {
    const { cookie } = await createTestUser();
    const only = await enrol(cookie);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/2fa/remove',
      headers: cookie,
      payload: { deviceId: only.deviceId, code: codeFor(only.secret) },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.user.totpEnabled).toBe(false);
  });

  it('a removed device stops working', async () => {
    const { cookie } = await createTestUser();
    const lost = await enrol(cookie);
    const backup = await enrol(cookie);

    await app.inject({
      method: 'POST', url: '/api/auth/2fa/remove', headers: cookie,
      payload: { deviceId: lost.deviceId, code: codeFor(backup.secret) },
    });

    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/remove', headers: cookie,
      payload: { deviceId: backup.deviceId, code: codeFor(lost.secret) },
    });

    expect(res.statusCode).toBe(400);
  });

  it('400 on a malformed code', async () => {
    const { cookie } = await createTestUser();
    const device = await enrol(cookie);

    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/remove', headers: cookie,
      payload: { deviceId: device.deviceId, code: '12' },
    });

    expect(res.statusCode).toBe(400);
  });
});
