import type { Metadata } from 'next';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Developer Portal',
  description: 'EdgeBalancer API documentation, quickstart guides, authentication, and developer resources for integrating with the Cloudflare Worker load balancer control plane.',
  alternates: { canonical: 'https://edge.nexoral.in/developers' },
};

export default function DevelopersPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <main>
        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', letterSpacing: '-0.03em', fontWeight: 700, marginBottom: 32 }}>
            Developer Portal
          </h1>
        </section>

        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 'clamp(15px, 2.5vw, 17px)', color: 'var(--text-2)', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Quickstart</h2>
              <p>EdgeBalancer is an API-first platform. Every operation available in the dashboard is also available via the REST API. Authentication uses JWT cookies set by Google OAuth.</p>
              <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <li>Sign in at <a href="/login" style={{ color: 'var(--accent)' }}>edge.nexoral.in/login</a> — this sets a JWT cookie.</li>
                <li>Call any API endpoint with credentials included (<code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>withCredentials: true</code>).</li>
                <li>Use the AI agent at <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>POST /api/ai/generate</code> for natural-language provisioning.</li>
              </ol>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>API Reference</h2>
              <p>Full OpenAPI 3.1 specification with all endpoints, schemas, and rate limits:</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                <a href="/openapi.json" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--accent)', color: '#000', fontWeight: 600, borderRadius: 'var(--radius)', fontSize: 14, textDecoration: 'none' }}>
                  OpenAPI Spec (JSON)
                </a>
                <a href="/llms.txt" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--text-2)', textDecoration: 'none' }}>
                  llms.txt
                </a>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Authentication</h2>
              <p>All API requests require a JWT cookie set by <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>POST /api/auth/google</code> with a Firebase ID token. The cookie is httpOnly and auto-sent by the browser. For programmatic access, use a headless browser or extract the cookie.</p>
              <p style={{ marginTop: 8 }}>Two-factor authentication (TOTP or WebAuthn passkeys) adds a second login step when enabled. The <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>/api/auth/google</code> response includes <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>twoFactorRequired: true</code> when 2FA is active.</p>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>AI Agent</h2>
              <p>The AI agent accepts natural language and executes real API calls. Send a prompt to <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>POST /api/ai/generate</code> and receive an SSE stream of events.</p>
              <pre style={{ background: 'var(--bg-2)', padding: 16, borderRadius: 8, fontSize: 13, overflow: 'auto', marginTop: 12 }}><code>{`curl -X POST https://edge.nexoral.in/api/ai/generate \\
  -H "Content-Type: application/json" \\
  -b "token=YOUR_JWT" \\
  -d '{"prompt": "Create a round-robin load balancer for example.com with origins https://a.com and https://b.com"}'`}</code></pre>
              <p style={{ marginTop: 8 }}>Rate limit: 30 requests per 15 minutes per user.</p>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>MCP Server</h2>
              <p>Model Context Protocol server — connect AI coding assistants directly to your EdgeBalancer account. One endpoint, 15 tools, OAuth 2.0 authentication.</p>

              <div style={{ padding: '12px 16px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                <code style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-2)' }}>
                  https://apiedge.nexoral.in/mcp
                </code>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Connect your client</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 8 }}>
                {[
                  { name: 'Claude Code', cmd: 'claude mcp add edgebalancer --transport http https://apiedge.nexoral.in/mcp' },
                  { name: 'Cursor', cmd: '{ "mcpServers": { "edgebalancer": { "url": "https://apiedge.nexoral.in/mcp" } } }' },
                  { name: 'OpenCode', cmd: '{ "mcp": { "edgebalancer": { "type": "http", "url": "https://apiedge.nexoral.in/mcp" } } }' },
                  { name: 'Codex', cmd: '[mcp_servers.edgebalancer]\nurl = "https://apiedge.nexoral.in/mcp"\ntransport = "http"' },
                ].map((client) => (
                  <div key={client.name} style={{ padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{client.name}</div>
                    <code style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', wordBreak: 'break-all', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{client.cmd}</code>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Available tools (15)</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {[
                  { name: 'list_load_balancers', cat: 'lb' },
                  { name: 'get_load_balancer', cat: 'lb' },
                  { name: 'create_load_balancer', cat: 'lb' },
                  { name: 'update_load_balancer', cat: 'lb' },
                  { name: 'delete_load_balancer', cat: 'lb' },
                  { name: 'pause_load_balancer', cat: 'lb' },
                  { name: 'resume_load_balancer', cat: 'lb' },
                  { name: 'list_gateways', cat: 'gw' },
                  { name: 'get_gateway', cat: 'gw' },
                  { name: 'create_gateway', cat: 'gw' },
                  { name: 'update_gateway', cat: 'gw' },
                  { name: 'delete_gateway', cat: 'gw' },
                  { name: 'pause_gateway', cat: 'gw' },
                  { name: 'resume_gateway', cat: 'gw' },
                  { name: 'list_zones', cat: 'cf' },
                ].map((tool) => (
                  <span key={tool.name} style={{
                    padding: '4px 8px', borderRadius: 'var(--radius)',
                    background: 'var(--bg-1)', border: '1px solid var(--line)',
                    fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)',
                  }}>
                    <span style={{ color: tool.cat === 'lb' ? 'var(--accent)' : tool.cat === 'gw' ? '#a855f7' : 'var(--green)' }}>●</span> {tool.name}
                  </span>
                ))}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Authentication</h3>
              <p>MCP uses OAuth 2.0 with dynamic client registration. On first connect, your client opens a browser for consent. After approval, a JWT is issued for subsequent requests.</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                <li>Discovery: <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>GET /.well-known/oauth-protected-resource</code></li>
                <li>Registration: <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>POST /mcp/auth/register</code></li>
                <li>Authorization: <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>GET /mcp/auth/authorize</code></li>
                <li>Token exchange: <code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>POST /mcp/auth/token</code></li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Endpoints Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                {[
                  { method: 'GET', path: '/api/loadbalancers', desc: 'List load balancers' },
                  { method: 'POST', path: '/api/loadbalancers', desc: 'Create load balancer' },
                  { method: 'PUT', path: '/api/loadbalancers/:id', desc: 'Update load balancer' },
                  { method: 'DELETE', path: '/api/loadbalancers/:id', desc: 'Delete load balancer' },
                  { method: 'POST', path: '/api/loadbalancers/:id/pause', desc: 'Pause load balancer' },
                  { method: 'POST', path: '/api/loadbalancers/:id/resume', desc: 'Resume load balancer' },
                  { method: 'GET', path: '/api/gateways', desc: 'List gateways' },
                  { method: 'POST', path: '/api/gateways', desc: 'Create gateway' },
                  { method: 'POST', path: '/api/ai/generate', desc: 'AI agent (SSE)' },
                  { method: 'GET', path: '/api/sessions', desc: 'Deployment history' },
                  { method: 'GET', path: '/api/stats', desc: 'Public stats' },
                  { method: 'GET', path: '/health', desc: 'Health check' },
                ].map((ep, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: ep.method === 'GET' ? 'var(--green)' : ep.method === 'POST' ? 'var(--accent)' : ep.method === 'PUT' ? '#3b82f6' : 'var(--red)', fontWeight: 600 }}>{ep.method}</span>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, marginTop: 4 }}>{ep.path}</div>
                    <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>{ep.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Rate Limits</h2>
              <p>All API responses include rate limit headers:</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                <li><code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>X-RateLimit-Limit</code> — max requests in window</li>
                <li><code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>X-RateLimit-Remaining</code> — remaining requests</li>
                <li><code style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>X-RateLimit-Reset</code> — seconds until window resets</li>
              </ul>
              <p style={{ marginTop: 8 }}>Default: 100 requests/minute per IP. Mutating endpoints (create, update, delete): 5 requests/15 minutes.</p>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Resources</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/openapi.json" style={{ color: 'var(--accent)', fontSize: 15 }}>OpenAPI 3.1 Specification</a>
                <a href="/llms.txt" style={{ color: 'var(--accent)', fontSize: 15 }}>llms.txt — Agent Instructions</a>
                <a href="/sitemap.xml" style={{ color: 'var(--accent)', fontSize: 15 }}>Sitemap</a>
                <a href="/blog" style={{ color: 'var(--accent)', fontSize: 15 }}>Blog — Guides and Tutorials</a>
                <a href="/strategies" style={{ color: 'var(--accent)', fontSize: 15 }}>Routing Strategies Documentation</a>
                <a href="/features" style={{ color: 'var(--accent)', fontSize: 15 }}>Feature Reference</a>
                <a href="/security" style={{ color: 'var(--accent)', fontSize: 15 }}>Security Policy</a>
                <a href="/contact" style={{ color: 'var(--accent)', fontSize: 15 }}>Contact Support</a>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
