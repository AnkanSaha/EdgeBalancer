import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { fail, ok } from './shared';
import type { ToolContext } from './types';

/**
 * find_tools is built last with the full name set (domain tools + research tools) so it can
 * validate requests and point the model at what exists. Loading is a side effect on
 * `ctx.unlocked`; the schemas reach the model when the loop re-binds next iteration.
 */
export function buildFindTools(names: Set<string>, ctx: ToolContext): StructuredToolInterface {
  return tool(
    async (input: any) => {
      const requested: unknown = input?.names;
      const asked: string[] = (Array.isArray(requested) ? requested : []).filter(
        (n): n is string => typeof n === 'string',
      );
      const valid = asked.filter((n) => names.has(n));

      if (valid.length === 0) {
        return fail(`No such tool. Available: ${[...names].join(', ')}.`);
      }

      valid.forEach((n) => ctx.unlocked.add(n));
      ctx.log.info(`find_tools loaded ${valid.join(', ')}`);

      return ok('ready');
    },
    {
      name: 'find_tools',
      description:
        'Load the tools you need before you can call them. Name every tool the request will need, then use them on your next step.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { names: { type: 'array', items: { type: 'string' }, minItems: 1 } },
        required: ['names'],
      },
    },
  ) as unknown as StructuredToolInterface;
}
