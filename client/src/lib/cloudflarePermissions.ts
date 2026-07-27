/**
 * The Cloudflare API token scopes EdgeBalancer asks for.
 *
 * Shared so onboarding and settings cannot disagree — they already had, with settings naming
 * three of the five that onboarding listed.
 */
export const CLOUDFLARE_PERMISSIONS: Array<[scope: string, resource: string, level: string]> = [
  ['Account', 'Workers Scripts', 'Edit'],
  ['Account', 'Account Analytics', 'Read'],
  ['Zone', 'Zone', 'Read'],
  ['Zone', 'DNS', 'Edit'],
  // Lets us detect a hostname already served by another Worker through a route. Deploys still
  // work without it — the check is skipped with a warning.
  ['Zone', 'Workers Routes', 'Read'],
];

/** "Workers Scripts: Edit, Account Analytics: Read, …" — for inline hints. */
export const permissionSummary = (): string =>
  CLOUDFLARE_PERMISSIONS.map(([, resource, level]) => `${resource}: ${level}`).join(', ');
