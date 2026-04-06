import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppResponse, createRequestAdapter, type AppHandler } from '../types/http';

const runSingleHandler = async (
  handler: AppHandler,
  request: ReturnType<typeof createRequestAdapter>,
  response: AppResponse
) => {
  return new Promise<boolean>((resolve, reject) => {
    let settled = false;

    const next = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;

      if (error) {
        reject(error);
        return;
      }

      resolve(true);
    };

    Promise.resolve(handler(request, response, next))
      .then(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      })
      .catch((error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      });
  });
};

export const runHandlers = async (
  handlers: AppHandler[],
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const adaptedRequest = createRequestAdapter(request);
  const response = new AppResponse(reply);

  for (const handler of handlers) {
    const shouldContinue = await runSingleHandler(handler, adaptedRequest, response);

    if (!shouldContinue || reply.sent) {
      break;
    }
  }
};
