# EdgeBalancer

**Deploy production load balancers on Cloudflare Workers in ~90 seconds. No servers. No config files.**

Live: **[edge.nexoral.in](https://edge.nexoral.in)** — connect Cloudflare → add origins → pick strategy → deploy.

---

## Why EdgeBalancer?

Load balancers today are overkill for most teams:

- `AWS ALB` ~$22/mo even idle, billed hourly
- `Cloudflare Load Balancing` $5/mo + per-request fees
- `Nginx/HAProxy` needs a server, config, and upkeep

If you run 2+ backends — free VMs, Railway, Workers, VPS — you shouldn’t pay more for the balancer than the backends. EdgeBalancer runs the balancer **at Cloudflare’s edge (330+ locations)** inside **your** Cloudflare account. Traffic goes edge → your origins. We never see it.

**Under 100k requests/day: $0** (Cloudflare Workers free tier).

---

## What you get

**7 routing strategies** — round-robin, weighted, IP hash, cookie-sticky, weighted-sticky, failover, geo-steering.

**Health checks + auto failover** — unhealthy origin is skipped automatically, comes back when healthy.

**AI assistant** — describe in plain English (“create a failover LB for api.example.com with two origins”) and it builds it for you.

**Visual dashboard** — pause/resume, attach domains, history, cancel in-flight deploys.

**Security by default** — Cloudflare OAuth, encrypted credentials, optional 2FA (authenticator app + passkeys). The Worker lives in your account, you own everything.

---

## How it works

1. Connect Cloudflare (one click with OAuth)
2. Add origins and choose a strategy
3. We generate the Worker and deploy to your account
4. Your hostname routes at the edge — 1-3ms overhead

That’s it. No servers to provision.

---

## Use cases

- **API gateway** for REST/GraphQL across multiple backends
- **Failover** for high availability (primary → backup)
- **Geo routing** — EU users → Frankfurt, US → Virginia, Asia → Singapore
- **Sticky sessions** for carts, auth, websockets
- **Cost cut** — replace ALB/LB with Workers

---

## Pricing

| Plan | Price | Load balancers | Health checks | AI |
|------|-------|----------------|---------------|----|
| Free | **₹0** | 5 | 2 | — |
| Trial | **₹0** for 14 days | 10 | 5 | — |
| Student | **₹49/mo** | 50 | 25 | ✓ |
| Pro | **₹299/mo** | unlimited | unlimited | ✓ |

Annual saves 20%: Student **₹470/yr**, Pro **₹2,870/yr**.

Full comparison → [edge.nexoral.in/pricing](https://edge.nexoral.in/pricing)

**Traffic cost:** 100k req/day = ₹0, 500k ≈ ₹670/mo, 1M ≈ ₹920/mo (Workers paid tier). No idle fee.

---

## Cost vs alternatives

| Traffic | EdgeBalancer | AWS ALB | Cloudflare LB |
|---------|--------------|---------|---------------|
| 10k/day | **₹0** | ~₹1,850/mo | ~₹420/mo |
| 100k/day | **₹0** | ~₹1,850/mo | ~₹420/mo |
| 500k/day | ~₹670/mo | ~₹2,100/mo | ~₹1,090/mo |

---

## Quick start (you, not dev)

1. Go to [edge.nexoral.in](https://edge.nexoral.in) → Sign in with Google
2. Onboarding → Connect Cloudflare (allow `Workers Scripts:Edit`, `Zone:Read`, `DNS:Edit`)
3. Create Load Balancer → pick domain, subdomain, origins, strategy → Deploy
4. Point your domain’s DNS in Cloudflare to the Worker (we guide you)

Docs: strategies, pricing, and FAQ are on the site.

---

## Links

- Website: [edge.nexoral.in](https://edge.nexoral.in)
- Pricing: [edge.nexoral.in/pricing](https://edge.nexoral.in/pricing)
- Contact: [connect@ankan.in](mailto:connect@ankan.in)

---

## License

Proprietary — [EdgeBalancer](https://edge.nexoral.in)
