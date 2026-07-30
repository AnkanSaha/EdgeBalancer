import { buildResearchTools } from '../../../modules/ai/services/research.service';

const log = { info: jest.fn(), warn: jest.fn() };
const [webSearch, fetchUrl] = buildResearchTools(log as any) as any[];

const call = async (t: any, args: Record<string, unknown>) => JSON.parse(await t.invoke(args));

describe('research tools — SSRF guard', () => {
  // None of these reach the network: the address is rejected before any request is made.
  it.each([
    ['cloud metadata', 'http://169.254.169.254/latest/meta-data/'],
    ['loopback ip', 'http://127.0.0.1:8000/api/auth/me'],
    ['loopback name', 'http://localhost:8000/health'],
    ['private 10/8', 'http://10.0.0.5/'],
    ['private 192.168/16', 'http://192.168.1.1/'],
    ['ipv6 loopback', 'http://[::1]/'],
    ['link-local ipv6', 'http://[fe80::1]/'],
    ['unspecified', 'http://0.0.0.0/'],
    ['ipv4-mapped loopback', 'http://[::ffff:127.0.0.1]/'],
  ])('refuses %s', async (_label, url) => {
    const result = await call(fetchUrl, { url });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not on the public internet/);
  });

  it.each([
    ['file scheme', 'file:///etc/passwd'],
    ['gopher scheme', 'gopher://example.com/'],
  ])('refuses %s', async (_label, url) => {
    const result = await call(fetchUrl, { url });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Only http and https/);
  });

  it('rejects a malformed url', async () => {
    const result = await call(fetchUrl, { url: 'not-a-url' });

    expect(result.ok).toBe(false);
  });

  it('requires a query and a url', async () => {
    expect((await call(webSearch, { query: '   ' })).ok).toBe(false);
    expect((await call(fetchUrl, { url: '' })).ok).toBe(false);
  });
});
