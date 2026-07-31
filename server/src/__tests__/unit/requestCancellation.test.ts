import { EventEmitter } from 'events';
import { createRequestCancellation, RequestCancelledError } from '../../utils/requestCancellation';

jest.mock('../../utils/loadBalancerOperationStore', () => ({
  isLoadBalancerOperationCancelled: async () => false,
}));

/**
 * Models what Node actually does for a POST whose body has already been consumed: the request
 * half closes early and never emits 'aborted', so only the response socket reports the client
 * going away mid-stream.
 */
const makePair = () => {
  const req: any = new EventEmitter();
  req.destroyed = false;

  const raw: any = new EventEmitter();
  raw.writableEnded = false;

  const res: any = { raw, get writableEnded() { return raw.writableEnded; } };
  return { req, res, raw };
};

describe('createRequestCancellation', () => {
  it('starts uncancelled', async () => {
    const { req, res } = makePair();
    const cancellation = createRequestCancellation(req, res);

    expect(cancellation.isCancelled()).toBe(false);
    await expect(cancellation.throwIfCancelled()).resolves.toBeUndefined();
  });

  it('detects a client that disconnects mid-stream', async () => {
    const { req, res, raw } = makePair();
    const cancellation = createRequestCancellation(req, res);

    // A consumed POST body closes the request half without ever emitting 'aborted' — this is the
    // case the old listeners missed entirely.
    req.emit('close');
    expect(cancellation.isCancelled()).toBe(false);

    // The response socket closing while we are still writing is the client actually leaving.
    raw.emit('close');
    expect(cancellation.isCancelled()).toBe(true);
    await expect(cancellation.throwIfCancelled()).rejects.toThrow(RequestCancelledError);
  });

  it('a normally finished response is not a cancellation', async () => {
    const { req, res, raw } = makePair();
    const cancellation = createRequestCancellation(req, res);

    raw.writableEnded = true;
    raw.emit('close');

    expect(cancellation.isCancelled()).toBe(false);
  });
});
