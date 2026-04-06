import { validateBody } from '../validation';

export const credentialsValidation = [
  validateBody((body) => {
    const errors: string[] = [];
    const accountId = typeof body?.accountId === 'string' ? body.accountId.trim() : '';
    const apiToken = typeof body?.apiToken === 'string' ? body.apiToken.trim() : '';

    if (!accountId) {
      errors.push('Cloudflare Account ID is required');
    } else if (accountId.length !== 32) {
      errors.push('Invalid Account ID format');
    }

    if (!apiToken) {
      errors.push('Cloudflare API Token is required');
    } else if (apiToken.length < 40) {
      errors.push('Invalid API Token format');
    }

    return errors;
  }),
];
