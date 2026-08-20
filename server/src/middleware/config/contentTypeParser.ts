import type { FastifyInstance } from 'fastify';

export const registerContentTypeParser = (app: FastifyInstance) => {
  // Allow empty JSON bodies to parse as {} instead of throwing.
  // Also stashes the raw string on req.rawBody so the Cashfree webhook
  // controller can verify the HMAC signature against the original bytes.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    if (typeof body === 'string') {
      (req as any).rawBody = body;
    }
    try {
      const json = body === '' ? {} : JSON.parse(body as string);
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });
};
