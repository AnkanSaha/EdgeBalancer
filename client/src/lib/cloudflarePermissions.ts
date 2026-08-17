/**
 * The Cloudflare API token scopes EdgeBalancer asks for.
 *
 * Shared so onboarding and settings cannot disagree — they already had, with settings naming
 * three of the five that onboarding listed.
 */
export const CLOUDFLARE_PERMISSIONS: Array<{
  scope: string;
  resource: string;
  level: string;
  why: string;
}> = [
  {
    scope: 'Account',
    resource: 'Workers Scripts',
    level: 'Edit',
    why: 'Deploy, update, and delete load balancer Workers on your account.',
  },
  {
    scope: 'Account',
    resource: 'Account Analytics',
    level: 'Read',
    why: 'Show request and error counts for your load balancers.',
  },
  {
    scope: 'Zone',
    resource: 'Zone',
    level: 'Read',
    why: 'List your domains so you can pick one for the load balancer.',
  },
  {
    scope: 'Zone',
    resource: 'DNS',
    level: 'Edit',
    why: 'Create DNS records for origin servers that use raw IPs.',
  },
  {
    scope: 'Zone',
    resource: 'Workers Routes',
    level: 'Read',
    why: 'Detect hostname conflicts before deploying (optional but recommended).',
  },
];

/** "Workers Scripts: Edit, Account Analytics: Read, …" — for inline hints. */
export const permissionSummary = (): string =>
  CLOUDFLARE_PERMISSIONS.map((p) => `${p.resource}: ${p.level}`).join(', ');
