export const ok = (data: unknown) => JSON.stringify({ ok: true, data });
export const fail = (message: string) => JSON.stringify({ ok: false, error: message });
