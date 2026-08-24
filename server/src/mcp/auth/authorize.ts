import type { FastifyRequest, FastifyReply } from 'fastify';
import { generateAuthorizationCode } from './token';
import { verifyToken } from '../../utils/jwt';

function getOrigin(request: FastifyRequest): string {
  const proto = (request.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${request.headers.host}`;
}

export async function handleAuthorizeGet(request: FastifyRequest, reply: FastifyReply) {
  const url = new URL(request.url, getOrigin(request));
  const clientId = url.searchParams.get('client_id') || '';
  const redirectUri = url.searchParams.get('redirect_uri') || '';
  const state = url.searchParams.get('state') || '';

  return reply.type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EdgeBalancer MCP — Authorize</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           display: flex; justify-content: center; align-items: center; min-height: 100vh;
           background: #0a0a0a; color: #e4e4e7; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px;
            padding: 40px; max-width: 420px; width: 90%; text-align: center; }
    .logo { font-size: 20px; font-weight: 700; margin-bottom: 24px; color: #a78bfa; }
    h1 { font-size: 18px; margin-bottom: 12px; }
    p { font-size: 14px; color: #a1a1aa; margin-bottom: 8px; line-height: 1.5; }
    .client { font-weight: 600; color: #e4e4e7; }
    .scopes { text-align: left; background: #09090b; border: 1px solid #27272a;
              border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13px; }
    .scopes li { margin: 4px 0; color: #a1a1aa; list-style: none; }
    .scopes li::before { content: "\\2713 "; color: #22c55e; }
    .btn { display: block; width: 100%; padding: 12px; margin-top: 20px;
           background: #7c3aed; color: #fff; border: none; border-radius: 8px;
           font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn:hover { background: #6d28d9; }
    .login-link { display: block; margin-top: 12px; font-size: 13px; color: #71717a; }
    .login-link a { color: #a78bfa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">EdgeBalancer</div>
    <h1>MCP Server Access</h1>
    <p>A client is requesting access to your EdgeBalancer account:</p>
    <p class="client">${escapeHtml(clientId || 'Unknown Client')}</p>
    <ul class="scopes">
      <li>List and view load balancers</li>
      <li>Create, update, and delete load balancers</li>
      <li>Pause and resume load balancers</li>
      <li>List and manage API gateways</li>
      <li>List Cloudflare zones</li>
    </ul>
    <form method="POST">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
      <input type="hidden" name="state" value="${escapeHtml(state)}">
      <button type="submit" class="btn">Login &amp; Approve</button>
    </form>
    <span class="login-link">You'll be redirected to EdgeBalancer to log in first</span>
  </div>
</body>
</html>`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function handleAuthorizePost(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as Record<string, string> | undefined;
  const clientId = body?.client_id || '';
  const redirectUri = body?.redirect_uri || '';
  const state = body?.state || '';

  const cookieHeader = request.headers.cookie || '';
  const sessionToken = cookieHeader.split(';').find((c) => c.trim().startsWith('token='))?.split('=')[1];
  if (!sessionToken) {
    const loginUrl = `${process.env.CLIENT_URL}/login?redirect=${encodeURIComponent(request.url)}`;
    return reply.redirect(loginUrl);
  }

  try {
    const payload = verifyToken(sessionToken);
    if (payload.stage) throw new Error('Challenge token');

    const code = generateAuthorizationCode(payload.userId, payload.email ?? null);

    const callbackUrl = new URL(redirectUri || getOrigin(request));
    callbackUrl.searchParams.set('code', code);
    if (state) callbackUrl.searchParams.set('state', state);

    return reply.redirect(callbackUrl.toString());
  } catch {
    return reply.code(401).type('text/html').send(`<!DOCTYPE html>
<html><head><title>Auth Required</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0a0a0a;color:#e4e4e7;}
.card{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:40px;text-align:center;}
a{color:#a78bfa;}</style></head>
<body><div class="card"><h2>Authentication Required</h2><p style="color:#a1a1aa;margin:12px 0;">Please log in to EdgeBalancer first.</p>
<a href="${process.env.CLIENT_URL}/login">Go to Login</a></div></body></html>`);
  }
}
