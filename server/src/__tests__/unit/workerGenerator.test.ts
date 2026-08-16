import { generateWorkerCode } from '../../services/workerGenerator';

const BASE_ORIGINS = [{ url: 'https://origin.example.com', weight: 100 }];

const extractConfig = (code: string) => {
  // After minification the code looks like: const config={"origins":[{...}],...};export default{...
  // A regex fails on nested braces, so track brace depth instead.
  const marker = 'config=';
  const start = code.indexOf(marker);
  if (start === -1) throw new Error('Config block not found in generated code');
  const jsonStart = code.indexOf('{', start);
  let depth = 0;
  let end = jsonStart;
  for (let i = jsonStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    if (code[i] === '}') depth--;
    if (depth === 0) { end = i + 1; break; }
  }
  // Minified output is a JS object literal (unquoted keys, booleans as !0/!1),
  // not JSON, so evaluate it rather than JSON.parse.
  return eval(`(${code.slice(jsonStart, end)})`);
};

describe('generateWorkerCode — exposeRealOrigin', () => {
  it('injects exposeRealOrigin: true when explicitly set', async () => {
    const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', exposeRealOrigin: true });
    const config = extractConfig(code);
    expect(config.exposeRealOrigin).toBe(true);
  });

  it('injects exposeRealOrigin: false when explicitly set', async () => {
    const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', exposeRealOrigin: false });
    const config = extractConfig(code);
    expect(config.exposeRealOrigin).toBe(false);
  });

  it('defaults exposeRealOrigin to false when omitted', async () => {
    const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin' });
    const config = extractConfig(code);
    expect(config.exposeRealOrigin).toBe(false);
  });

  it('exposeRealOrigin: true and false produce different worker code', async () => {
    const withTrue = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', exposeRealOrigin: true });
    const withFalse = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', exposeRealOrigin: false });
    expect(withTrue).not.toBe(withFalse);
  });

  it('works correctly for every non-paused strategy', async () => {
    const strategies = [
      'round-robin',
      'weighted-round-robin',
      'ip-hash',
      'cookie-sticky',
      'weighted-cookie-sticky',
      'failover',
      'geo-steering',
    ] as const;

    for (const strategy of strategies) {
      const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy, exposeRealOrigin: true });
      const config = extractConfig(code);
      expect(config.exposeRealOrigin).toBe(true);
    }
  });
});

// ─── CORS ─────────────────────────────────────────────────────────────────────

describe('generateWorkerCode — CORS', () => {
  it('injects corsEnabled: true when explicitly set', async () => {
    const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', corsEnabled: true });
    const config = extractConfig(code);
    expect(config.corsEnabled).toBe(true);
  });

  it('injects corsEnabled: false when explicitly set', async () => {
    const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', corsEnabled: false });
    const config = extractConfig(code);
    expect(config.corsEnabled).toBe(false);
  });

  it('defaults corsEnabled to false when omitted', async () => {
    const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin' });
    const config = extractConfig(code);
    expect(config.corsEnabled).toBe(false);
  });

  it('embeds corsOrigins array in the config', async () => {
    const corsOrigins = ['https://a.com', 'https://b.com'];
    const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', corsEnabled: true, corsOrigins });
    const config = extractConfig(code);
    expect(config.corsOrigins).toEqual(corsOrigins);
  });

  it('corsEnabled: true and corsEnabled: false produce different worker code', async () => {
    const withTrue  = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', corsEnabled: true });
    const withFalse = await generateWorkerCode({ origins: BASE_ORIGINS, strategy: 'round-robin', corsEnabled: false });
    expect(withTrue).not.toBe(withFalse);
  });

  it('includes corsEnabled in the config for every strategy', async () => {
    const strategies = [
      'round-robin',
      'weighted-round-robin',
      'ip-hash',
      'cookie-sticky',
      'weighted-cookie-sticky',
      'failover',
      'geo-steering',
    ] as const;

    for (const strategy of strategies) {
      const code = await generateWorkerCode({ origins: BASE_ORIGINS, strategy, corsEnabled: true });
      const config = extractConfig(code);
      expect(config.corsEnabled).toBe(true);
    }
  });
});
