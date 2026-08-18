import type { FastifyInstance } from 'fastify';

export const registerContentTypeParser = (app: FastifyInstance) => {
  // Allow empty JSON bodies to parse as {} instead of throwing
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try {
      const json = body === '' ? {} : JSON.parse(body as string);
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });
};
