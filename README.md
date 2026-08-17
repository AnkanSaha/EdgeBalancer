# EdgeBalancer

**Deploy load balancers on Cloudflare Workers in 90 seconds. No servers. No DevOps. No code.**

---

## The Problem

Running a load balancer today is expensive and complicated:

- **AWS ALB** costs ~$22/month before any traffic — and bills by the hour even when idle
- **Cloudflare Load Balancing** starts at $5/month plus per-query fees
- **Nginx/HAProxy** require a dedicated server, manual configuration, and constant maintenance
- **All of them** require DevOps knowledge, infrastructure setup, and ongoing management

For solo developers and small teams running backends on free tiers — two Oracle Always Free VMs, a couple of Cloudflare Workers, Railway hobby instances — paying $22+/month for a load balancer doesn't make sense. And spending hours configuring Nginx for a simple API with two backends is overkill.

## The Solution

EdgeBalancer turns your Cloudflare Worker into a production load balancer through a visual dashboard. You connect your Cloudflare account, add your origin servers, pick a routing strategy, and deploy — all in under 90 seconds.

The Worker runs on Cloudflare's edge (330+ data centers worldwide). Traffic flows directly from the edge to your origins. EdgeBalancer never sees your production traffic — it only manages the configuration.

**Under 100k requests/day, it costs $0.**

## What It Solves

| Problem | How EdgeBalancer Solves It |
|---------|---------------------------|
| Load balancers are expensive | Runs on Cloudflare Workers free tier (100k req/day at $0) |
| Configuration is complex | Visual dashboard — pick strategy, add origins, click deploy |
| Requires DevOps knowledge | No servers to manage — Workers are serverless |
| Takes hours to set up | Deploys in ~90 seconds |
| Single point of failure | Runs at the edge (330+ PoPs), not a centralized server |
| No health checks on free tier | Built-in health checks with automatic failover |
| Vendor lock-in | Workers deploy to YOUR Cloudflare account — you own everything |

## Vision

Load balancing should be as easy as buying a domain. No servers to provision, no configuration files to write, no infrastructure to maintain. Pick your origins, choose a strategy, deploy. The edge handles the rest.

EdgeBalancer is the control plane. Cloudflare is the data plane. You own everything.

## Use Cases

**API Gateway** — Route REST/GraphQL traffic across multiple backend services with weighted distribution and automatic failover.

**Multi-Region Apps** — Geo-steer users to the closest origin based on location. Serve EU users from Frankfurt, US users from Virginia, Asia users from Singapore.

**High Availability** — Failover strategy ensures requests automatically retry healthy origins if your primary server goes down.

**Stateful Workloads** — Cookie-sticky routing keeps users pinned to the same backend for sessions, shopping carts, and WebSocket connections.

**Microservices** — Deploy multiple load balancers for different services, each with its own routing strategy and origin set.

**Cost Optimization** — Replace expensive AWS ALBs or Cloudflare Load Balancing with Workers at a fraction of the cost.

## Features

**7 Routing Strategies**
- Round Robin — Equal distribution, zero configuration
- Weighted Round Robin — Proportional traffic based on server capacity
- IP Hash — Same visitor, same server, every time
- Sticky Sessions — Cookie-based session persistence
- Weighted Sticky Sessions — Capacity-aware with session persistence
- Failover — Primary-backup with automatic recovery
- Geographic Routing — Route by visitor location (city, country, continent)

**Health Checks**
- Periodic health monitoring of all origin servers
- Automatic failover when an origin goes down
- Automatic recovery when the origin comes back
- Configurable intervals, paths, and thresholds

**Security**
- OAuth connection to Cloudflare (no manual token management)
- AES-256-GCM encrypted credentials at rest
- JWT authentication with httpOnly cookies
- Optional two-factor authentication (TOTP + Passkeys)
- Worker scripts are obfuscated before deployment

**Deployment**
- One-click deploy from the visual dashboard
- Cloudflare Worker Versions + Deployments for safe updates
- Automatic rollback on failure
- Deployment history with full Worker script snapshots
- Cancel in-flight operations

**AI Assistant**
- Describe what you want in natural language
- AI agent creates, updates, or manages load balancers
- Streams progress in real-time via SSE
- Searches docs and explains errors when deploys fail

## Who It's For

- Solo developers running backends on free tiers
- Small startups that need real load balancing without enterprise costs
- Teams migrating from centralized load balancers to edge computing
- Anyone running 2+ origin servers on Cloudflare

## How It Works

```
1. You connect your Cloudflare account (OAuth or API token)
2. You configure origins + strategy in the dashboard
3. EdgeBalancer generates a Worker script
4. The Worker is deployed to YOUR Cloudflare account
5. Traffic routes at the edge (330+ PoPs, ~1-3ms overhead)
6. Health checks monitor your origins automatically
7. EdgeBalancer never sees your production traffic
```

## Cost

| Traffic | EdgeBalancer | AWS ALB | Cloudflare LB |
|---------|-------------|---------|---------------|
| 10k req/day | **$0** | ~$22/mo | ~$5/mo |
| 100k req/day | **$0** | ~$22/mo | ~$5/mo |
| 500k req/day | **~$8/mo** | ~$25/mo | ~$13/mo |
| 1M req/day | **~$11/mo** | ~$30/mo | ~$18/mo |

No idle fees. No egress charges. No per-query costs.

## Links

- **Website**: [edge.nexoral.in](https://edge.nexoral.in)
- **Strategies**: [edge.nexoral.in/strategies](https://edge.nexoral.in/strategies)
- **Pricing**: [edge.nexoral.in/pricing](https://edge.nexoral.in/pricing)
- **FAQ**: [edge.nexoral.in/faq](https://edge.nexoral.in/faq)
- **Blog**: [edge.nexoral.in/blog](https://edge.nexoral.in/blog)
- **Contact**: [connect@ankan.in](mailto:connect@ankan.in)

## License

Proprietary — [EdgeBalancer Inc.](https://edge.nexoral.in)
