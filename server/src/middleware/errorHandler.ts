import type { FastifyInstance } from 'fastify';

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    const appError = error as Error & { statusCode?: number };

    console.error('Error:', appError);

    const statusCode = appError.statusCode || (reply.statusCode !== 200 ? reply.statusCode : 500);
    const message = appError.message || 'Internal server error';

    reply.code(statusCode).send({
      success: false,
      message,
      data: null,
    });
  });
};
