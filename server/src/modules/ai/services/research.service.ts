import axios from 'axios';
import { BlockList, isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { tool } from '@langchain/core/tools';
import { search, SafeSearchType } from 'duck-duck-scrape';
import type { RunLogger } from './log.service';

/**
 * Read-only research tools for root-cause analysis: search the web, then read a page.
 *
 * Both fetch a URL the model chose, from a server holding decrypted Cloudflare credentials inside
 * a cluster — an SSRF target whose input is partly attacker controlled (an origin hostname, a
 * Cloudflare error string, the text of a page it just read). Hence `assertPublicUrl` on every hop.
 */

const TIMEOUT_MS = 8000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;
// Results re-enter `messages` and are re-sent on every later model call, so they stay small.
const MAX_SNIPPET = 220;
const MAX_PAGE_CHARS = 2000;

const PRIVATE_V4 = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const;

const PRIVATE_V6 = [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const;

const blocked = new BlockList();
PRIVATE_V4.forEach(([net, bits]) => blocked.addSubnet(net, bits, 'ipv4'));
PRIVATE_V6.forEach(([net, bits]) => blocked.addSubnet(net, bits, 'ipv6'));

const isBlockedIp = (address: string): boolean => {
  const version = isIP(address);
  if (version === 0) return true;

  // ::ffff:127.0.0.1 and friends — check the embedded v4 address, not the v6 wrapper.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return blocked.check(mapped[1], 'ipv4');

  return blocked.check(address, version === 4 ? 'ipv4' : 'ipv6');
};

// Resolves the hostname and checks every address, so a domain pointing at 127.0.0.1 is caught too.
async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`"${raw}" is not a valid URL.`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs can be read.');
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');

  if (isIP(host)) {
    if (isBlockedIp(host)) throw new Error('That address is not on the public internet.');
    return url;
  }

  let addresses;
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new Error(`Could not resolve "${host}".`);
  }

  if (addresses.length === 0 || addresses.some((a) => isBlockedIp(a.address))) {
    throw new Error('That address is not on the public internet.');
  }

  return url;
}

/** Follows redirects manually so each hop is re-validated — axios would follow them unchecked. */
async function safeGet(target: string): Promise<string> {
  let current = target;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const url = await assertPublicUrl(current);

    const response = await axios.get(url.toString(), {
      timeout: TIMEOUT_MS,
      maxRedirects: 0,
      maxContentLength: MAX_BYTES,
      responseType: 'text',
      validateStatus: (status) => status < 400,
      headers: { 'User-Agent': 'EdgeBalancer/1.0 (+diagnostics)', Accept: 'text/html,text/plain' },
    });

    if (response.status < 300) return typeof response.data === 'string' ? response.data : String(response.data);

    const location = response.headers?.location;
    if (!location) throw new Error('Redirect without a destination.');
    current = new URL(location, url).toString();
  }

  throw new Error('Too many redirects.');
}

const toText = (html: string): string =>
  html
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ok = (data: unknown) => JSON.stringify({ ok: true, data });
const fail = (message: string) => JSON.stringify({ ok: false, error: message });

export const RESEARCH_TOOL_NAMES = ['web_search', 'fetch_url'] as const;

// When these may be used is a rule in SYSTEM_PROMPT — the model decides that. What they may reach
// is enforced here, where no prompt can talk past it.
export function buildResearchTools(log: RunLogger) {
  const webSearch = tool(
    async (input: any) => {
      const query = typeof input?.query === 'string' ? input.query.trim() : '';
      if (!query) return fail('A search query is required.');

      const numResults = typeof input?.numResults === 'number' ? input.numResults : 5;

      try {
        const response = await search(query, { safeSearch: SafeSearchType.STRICT });

        if (response.noResults || !response.results?.length) {
          return fail(`No results for "${query}".`);
        }

        const results = response.results.slice(0, numResults).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.description.slice(0, MAX_SNIPPET),
        }));

        log.info(`web_search "${query}" → ${results.length} result(s)`);

        return ok({ results });
      } catch (error: any) {
        return fail(`Search failed: ${error?.message ?? 'unknown error'}`);
      }
    },
    {
      name: 'web_search',
      description:
        'Search the web. Use it to research an error message you cannot explain from the tool result alone. Returns titles, urls and snippets.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search terms, e.g. the exact error message' },
          numResults: { type: 'integer', description: 'Number of results to return (default 5, max 20)', minimum: 1, maximum: 20 },
        },
        required: ['query'],
      },
    },
  );

  const fetchUrl = tool(
    async (input: any) => {
      const target = typeof input?.url === 'string' ? input.url.trim() : '';
      if (!target) return fail('A url is required.');

      try {
        const body = await safeGet(target);
        const text = toText(body).slice(0, MAX_PAGE_CHARS);

        log.info(`fetch_url ${target} → ${text.length} chars`);

        return text.length === 0 ? fail('That page had no readable text.') : ok({ url: target, text });
      } catch (error: any) {
        return fail(`Could not read that page: ${error?.message ?? 'unknown error'}`);
      }
    },
    {
      name: 'fetch_url',
      description:
        'Read the visible text of a public web page, truncated to 2000 characters. Use it on a url from web_search when the snippet is not enough to explain an error.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { url: { type: 'string', description: 'Public http(s) url, usually one from web_search' } },
        required: ['url'],
      },
    },
  );

  return [webSearch, fetchUrl];
}
