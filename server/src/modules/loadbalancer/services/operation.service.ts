/**
 * Operation Service
 *
 * Helpers for operation tracking and error handling.
 */

import { RequestCancelledError } from '../../../utils/requestCancellation';

/**
 * Check if error is a cancellation error
 */
export function isCancellationError(error: unknown): boolean {
  return error instanceof RequestCancelledError;
}
