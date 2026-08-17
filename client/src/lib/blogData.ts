export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  readTime: string;
  category: string;
  tags: string[];
  content: string;
}

export const BLOG_CATEGORIES = [
  'Getting Started',
  'Tutorials',
  'Comparisons',
  'Deep Dives',
  'Best Practices',
  'Use Cases',
];

export const blogPosts: BlogPost[] = [
  // ─── Getting Started ────────────────────────────────────────────────
  {
    slug: 'how-to-load-balance-cloudflare-workers',
    title: 'How to Load Balance Cloudflare Workers in 2026',
    description: 'A complete guide to load balancing Cloudflare Workers. Distribute traffic across multiple origins with health checks, failover, and zero downtime.',
    date: '2026-08-10',
    readTime: '8 min',
    category: 'Getting Started',
    tags: ['cloudflare workers', 'load balancing', 'tutorial', 'edge computing'],
    content: `
## What is Cloudflare Workers Load Balancing?

Cloudflare Workers run at the edge — on 330+ data centers worldwide. When you load balance with Workers, traffic routing happens at the edge, not at a centralized load balancer. Lower latency, no single point of failure, automatic global distribution.

Traditional load balancers (AWS ALB, Nginx, HAProxy) sit between your users and your servers. Workers-based load balancing replaces that with a lightweight script that runs at every Cloudflare data center.

## Why Workers Instead of Traditional Load Balancers?

**Cost:** AWS ALB costs ~$22/month before any traffic. Workers cost $0 under 100k requests/day.

**Latency:** Traditional LBs add 5-20ms. Workers add ~1-3ms (edge-level routing).

**Global distribution:** Traditional LB serves from one region. Workers serve from the closest data center automatically.

**No idle fees:** AWS charges by the hour even at zero traffic. Workers charge per request only.

## Deploy a Load Balancer

1. Connect your Cloudflare account via OAuth or API token
2. Choose a routing strategy (round robin, weighted, IP hash, sticky, failover, geo)
3. Add your origin server URLs
4. Click deploy — live in ~90 seconds

## Health Checks

EdgeBalancer runs periodic health checks to each origin. If an origin returns 5xx, times out, or refuses connections, it's removed from rotation. When it recovers, traffic resumes. Intervals are configurable from 10 seconds to 5 minutes.

## What if EdgeBalancer Goes Down?

Nothing. Your load balancers keep running. EdgeBalancer is only the control plane — the load balancer runs in your Cloudflare account.

## Next Steps

- [Compare routing strategies](/strategies)
- [See pricing](/pricing)
- [Deploy your first load balancer](/register)
    `,
  },
  {
    slug: 'deploy-load-balancer-in-90-seconds',
    title: 'Deploy a Cloudflare Load Balancer in 90 Seconds',
    description: 'Step-by-step guide to deploying a production load balancer on Cloudflare Workers in under 90 seconds.',
    date: '2026-08-12',
    readTime: '4 min',
    category: 'Getting Started',
    tags: ['quick start', 'deployment', 'cloudflare workers'],
    content: `
## What You Need

- A Cloudflare account with at least one domain
- 90 seconds

## Step 1: Sign In (10 seconds)

Go to EdgeBalancer and click "Sign in with Google."

## Step 2: Connect Cloudflare (20 seconds)

Click "Connect with Cloudflare." Authorize EdgeBalancer. Done.

## Step 3: Create Load Balancer (30 seconds)

Name it, select domain, add origins, choose strategy.

## Step 4: Deploy (30 seconds)

Click "Deploy." Your load balancer is live on 330+ data centers.

## Common Questions

**Can I change strategy later?** Yes, no downtime.

**Can I add more origins?** Yes, edit and redeploy.

**How much does it cost?** Under 100k req/day, $0.
    `,
  },
  {
    slug: 'free-load-balancer-for-cloudflare-workers',
    title: 'Free Load Balancer for Cloudflare Workers (2026)',
    description: 'Set up a free load balancer. 100k requests/day at $0, no credit card required.',
    date: '2026-08-03',
    readTime: '5 min',
    category: 'Getting Started',
    tags: ['free', 'cloudflare workers', 'load balancer'],
    content: `
## Is It Really Free?

Yes. Under 100k requests/day, Cloudflare Workers cost $0. EdgeBalancer is free. No credit card.

## What You Get

- 100k requests/day (3M/month)
- 7 routing strategies
- Health checks with failover
- Unlimited load balancers
- Encrypted credentials
- OAuth connection
- Deployment history

## Setup (3 Steps)

1. Sign up with Google
2. Connect Cloudflare via OAuth
3. Deploy your first load balancer

## FAQ

**Exceed 100k req/day?** $0.30 per million after that.

**Need a credit card?** No.

**Traffic through EdgeBalancer?** No. Direct from Cloudflare edge to your origins.
    `,
  },
  {
    slug: 'connect-cloudflare-account-edgebalancer',
    title: 'Connect Your Cloudflare Account to EdgeBalancer',
    description: 'Two methods: OAuth (recommended) or API token. Secure, encrypted, 30 seconds.',
    date: '2026-07-28',
    readTime: '4 min',
    category: 'Getting Started',
    tags: ['cloudflare', 'oauth', 'api token', 'setup'],
    content: `
## Two Methods

**OAuth (Recommended):** One-click authorization. No manual token creation.

**API Token:** Manual token for advanced users who need fine-grained control.

## OAuth Flow

1. Click "Connect with Cloudflare"
2. Redirected to Cloudflare
3. Review permissions
4. Click "Authorize"
5. Done

## API Token Flow

1. Go to Cloudflare → API Tokens → Create Custom Token
2. Add required permissions
3. Copy token
4. Paste in EdgeBalancer

## Security

Both methods are secure. Credentials are encrypted with AES-256-GCM.
    `,
  },
  {
    slug: 'edgebalancer-dashboard-guide',
    title: 'EdgeBalancer Dashboard: Complete Guide',
    description: 'Create, manage, monitor load balancers from one dashboard.',
    date: '2026-07-22',
    readTime: '6 min',
    category: 'Getting Started',
    tags: ['dashboard', 'guide', 'management'],
    content: `
## Sections

**Load Balancers:** All your load balancers with status, origins, strategy, health.

**Create:** Name, domain, origins, strategy, deploy.

**Sessions:** Deployment history with full config snapshots.

**Settings:** Cloudflare connection, two-factor auth.

## Actions

- **Edit:** Change config with safe versioned deployments
- **Pause:** Stop routing temporarily
- **Resume:** Restart paused load balancer
- **Delete:** Remove permanently

## Health Monitoring

Real-time health status per origin with configurable checks.
    `,
  },

  // ─── Tutorials ──────────────────────────────────────────────────────
  {
    slug: 'cloudflare-health-checks-and-failover',
    title: 'Health Checks and Automatic Failover',
    description: 'Keep origins healthy with zero downtime. How health checks and failover work.',
    date: '2026-07-30',
    readTime: '7 min',
    category: 'Tutorials',
    tags: ['health checks', 'failover', 'high availability'],
    content: `
## Why Health Checks Matter

Without health checks, traffic goes to dead servers. Health checks detect failures and remove unhealthy origins automatically.

## How It Works

Periodic HTTP requests to your health path. 200 = healthy. 5xx/timeout = unhealthy.

| Setting | Default |
|---------|---------|
| Interval | 30 seconds |
| Path | /health |
| Timeout | 5 seconds |
| Unhealthy threshold | 2 failures |
| Healthy threshold | 2 successes |

## Failover

Unhealthy origin removed → traffic redistributed. Origin recovers → added back automatically.

## Best Practices

1. Keep health checks lightweight (don't query DB)
2. Use threshold of 2+ to avoid false positives
3. Test failover regularly
4. Monitor health check logs
    `,
  },
  {
    slug: 'geo-steering-cloudflare-workers',
    title: 'Geographic Routing: Route Users to Nearest Server',
    description: 'Implement geo-steering for minimum latency and GDPR compliance.',
    date: '2026-07-25',
    readTime: '7 min',
    category: 'Tutorials',
    tags: ['geo-steering', 'geographic routing', 'gdpr'],
    content: `
## What is Geographic Routing?

Routes each user to the origin closest to their location.

## Why Use It?

- **Latency:** Tokyo→US = 150ms. Tokyo→Tokyo = 5ms.
- **GDPR:** EU data stays in EU servers.
- **Regional content:** Serve localized content by location.

## How It Works

1. City match
2. Country match
3. Continent match
4. Fallback (round-robin)

## Limitations

- VPNs mask real location
- Corporate NAT may show wrong location
    `,
  },
  {
    slug: 'cookie-sticky-sessions-cloudflare-workers',
    title: 'Cookie Sticky Sessions: Keep Users on Same Server',
    description: 'Implement cookie-based sticky sessions for shopping carts, logins, WebSockets.',
    date: '2026-07-20',
    readTime: '6 min',
    category: 'Tutorials',
    tags: ['sticky sessions', 'cookies', 'session persistence'],
    content: `
## What Are Sticky Sessions?

Keep users on the same server throughout their visit. Essential for shopping carts, login sessions, WebSockets.

## How It Works

1. First request: pick origin, set cookie
2. Next requests: cookie routes to same origin
3. Origin down: pick new origin, update cookie

## Use Cases

- Shopping carts
- Login sessions
- WebSocket connections
- Multi-step forms

## Limitations

- Not needed for stateless apps
- May conflict with CDN caching
    `,
  },
  {
    slug: 'ip-hash-routing-explained',
    title: 'IP Hash Routing: Consistent Without Cookies',
    description: 'Same visitor, same server, every time. No cookies required.',
    date: '2026-07-15',
    readTime: '5 min',
    category: 'Tutorials',
    tags: ['ip hash', 'routing', 'consistent routing'],
    content: `
## How It Works

Client IP is hashed to determine origin. Same IP = same server.

## When to Use

- CDN cache warming
- API consumers need consistency
- No-cookie environments

## When NOT to Use

- Corporate NAT (many users, one IP)
- VPN users
- Dynamic IPs
    `,
  },
  {
    slug: 'failover-strategy-explained',
    title: 'Failover: Automatic Backup Server Failover',
    description: 'Primary goes down, backup takes over. Automatically.',
    date: '2026-07-10',
    readTime: '5 min',
    category: 'Tutorials',
    tags: ['failover', 'disaster recovery', 'high availability'],
    content: `
## How It Works

All traffic → primary. Primary fails → traffic to backup. Primary recovers → traffic returns.

## When to Use

- Primary + hot backup
- Disaster recovery
- Staging as backup

## Best Practices

1. Always enable health checks
2. Threshold of 2-3 failures
3. Test failover regularly
    `,
  },
  {
    slug: 'weighted-round-robin-explained',
    title: 'Weighted Round Robin: Proportional Traffic',
    description: 'Distribute traffic based on server capacity. Bigger servers get more.',
    date: '2026-07-05',
    readTime: '5 min',
    category: 'Tutorials',
    tags: ['weighted round robin', 'traffic distribution'],
    content: `
## How It Works

Each origin gets a weight. Traffic distributed proportionally.

## Use Cases

- Mixed server capacities
- Gradual rollouts
- A/B testing
- Migrations

## Example

- Origin A (weight: 70) → 70% traffic
- Origin B (weight: 30) → 30% traffic
    `,
  },
  {
    slug: 'round-robin-routing-explained',
    title: 'Round Robin: Simple Equal Distribution',
    description: 'The simplest load balancing strategy. Equal traffic to all servers.',
    date: '2026-07-01',
    readTime: '4 min',
    category: 'Tutorials',
    tags: ['round robin', 'load balancing', 'basics'],
    content: `
## How It Works

Each request goes to the next server in line. Server A → B → C → A → B → C...

## When to Use

- Stateless APIs
- Equal capacity servers
- Simple setups

## When NOT to Use

- Different server capacities
- Need session persistence
    `,
  },

  // ─── Comparisons ────────────────────────────────────────────────────
  {
    slug: 'cloudflare-workers-vs-aws-alb-cost-comparison',
    title: 'Cloudflare Workers vs AWS ALB: 2026 Cost Comparison',
    description: 'Real numbers. 64% savings at 15M requests/month.',
    date: '2026-08-08',
    readTime: '6 min',
    category: 'Comparisons',
    tags: ['aws', 'cloudflare', 'cost comparison'],
    content: `
## Numbers

| Monthly | AWS ALB | CF Workers | Savings |
|---------|---------|------------|---------|
| 3M (free) | $22 | $0 | 100% |
| 15M | $22 | $6.50 | 71% |
| 30M | $25 | $11 | 56% |

## AWS ALB

Base: $16.43/mo (hourly) + LCU: $5.84/mo = $22.27/mo minimum.

## Workers

$5/mo subscription + $0.30/M overage. Free tier: 100k req/day forever.

## When AWS Makes Sense

- Deep AWS integration
- Already committed to AWS

## When Workers Make Sense

- Lowest cost
- Global edge routing
- Zero cold starts
    `,
  },
  {
    slug: 'edgebalancer-vs-cloudflare-load-balancing',
    title: 'EdgeBalancer vs Cloudflare Load Balancing',
    description: 'Request-level (Workers) vs DNS-based (CF LB). Compare features and pricing.',
    date: '2026-08-01',
    readTime: '5 min',
    category: 'Comparisons',
    tags: ['cloudflare load balancing', 'comparison'],
    content: `
## Key Difference

**EdgeBalancer:** Per-request routing via Workers.

**CF LB:** DNS-based routing.

## Comparison

| Feature | EdgeBalancer | CF LB |
|---------|-------------|-------|
| Free tier | 100k req/day | None |
| Base cost | $0 | $5/mo |
| Cookie sticky | Yes | No |
| Geo-steering | Yes | Extra cost |
    `,
  },
  {
    slug: 'cloudflare-workers-vs-nginx',
    title: 'Cloudflare Workers vs Nginx: Load Balancer Comparison',
    description: 'Edge vs centralized. Serverless vs self-hosted.',
    date: '2026-07-28',
    readTime: '6 min',
    category: 'Comparisons',
    tags: ['nginx', 'cloudflare workers', 'comparison'],
    content: `
## Difference

**Nginx:** Self-hosted, config files, single region.

**Workers:** Serverless, visual dashboard, 330+ locations.

## When Nginx

- TCP load balancing
- Full control needed
- On-premise

## When Workers

- Zero server management
- Global distribution
- Lowest cost
    `,
  },
  {
    slug: 'load-balancer-pricing-2026',
    title: 'Load Balancer Pricing 2026: Complete Comparison',
    description: 'AWS vs Cloudflare vs Nginx vs HAProxy. Real costs at every level.',
    date: '2026-07-15',
    readTime: '7 min',
    category: 'Comparisons',
    tags: ['pricing', 'comparison', '2026'],
    content: `
## At 100k req/day

| Solution | Cost |
|----------|------|
| EdgeBalancer | $0 |
| AWS ALB | ~$22 |
| CF LB | ~$10 |
| Nginx | ~$20 |

## Hidden Costs

**AWS:** Egress, cross-AZ, WAF, CloudWatch.

**Nginx:** Server rental, your time, SSL management.

**EdgeBalancer:** Just Cloudflare usage. Nothing else.
    `,
  },
  {
    slug: 'cloudflare-workers-vs-haproxy',
    title: 'Cloudflare Workers vs HAProxy',
    description: 'Edge computing vs traditional infrastructure.',
    date: '2026-07-20',
    readTime: '5 min',
    category: 'Comparisons',
    tags: ['haproxy', 'cloudflare workers', 'comparison'],
    content: `
## HAProxy

Fast, reliable, battle-tested. Requires server, config, maintenance.

## Workers

Serverless, edge, no management. ~1-3ms overhead.

## When HAProxy

- TCP load balancing
- Sub-millisecond requirements
- Private networks

## When Workers

- HTTP/HTTPS only
- Zero management
- Global distribution
    `,
  },

  // ─── Deep Dives ─────────────────────────────────────────────────────
  {
    slug: '7-routing-strategies-explained',
    title: '7 Cloudflare Worker Routing Strategies Explained',
    description: 'Complete guide to all 7 strategies. When to use each.',
    date: '2026-08-05',
    readTime: '10 min',
    category: 'Deep Dives',
    tags: ['routing strategies', 'cloudflare workers'],
    content: `
## 1. Round Robin
Equal distribution. Stateless APIs, equal servers.

## 2. Weighted Round Robin
Proportional by weight. Mixed capacities, rollouts.

## 3. IP Hash
Consistent by IP. Cache warming, no cookies.

## 4. Sticky Sessions
Cookie-based. Shopping carts, logins.

## 5. Weighted Sticky
Capacity + persistence. Stateful + mixed.

## 6. Failover
Primary → backup. DR, HA.

## 7. Geo-Steering
By location. GDPR, latency.

## Quick Guide

| Situation | Strategy |
|-----------|----------|
| Stateless, equal | Round Robin |
| Different capacity | Weighted |
| No cookies | IP Hash |
| Shopping cart | Sticky |
| Primary + backup | Failover |
| Global users | Geo-steering |
    `,
  },
  {
    slug: 'how-edge-load-balancing-works',
    title: 'How Edge Load Balancing Works',
    description: 'Edge vs centralized. Why it matters for latency and availability.',
    date: '2026-07-25',
    readTime: '8 min',
    category: 'Deep Dives',
    tags: ['edge computing', 'load balancing', 'architecture'],
    content: `
## Traditional

User (Tokyo) → LB (US) → Server (US) = 150ms+

## Edge

User (Tokyo) → Edge (Tokyo) → Server = 1-5ms

## Why Edge Wins

- Latency: 1-3ms vs 5-20ms
- Availability: 330+ locations vs 1
- Cost: $0-11/mo vs $16+/mo
    `,
  },
  {
    slug: 'cloudflare-workers-architecture',
    title: 'Understanding Cloudflare Workers Architecture',
    description: 'V8 isolates, edge computing, minimal latency.',
    date: '2026-07-18',
    readTime: '7 min',
    category: 'Deep Dives',
    tags: ['cloudflare workers', 'architecture', 'v8 isolates'],
    content: `
## V8 Isolates

Same engine as Chrome. No cold start (~0ms), low memory, fast execution.

## Edge Execution

Request → nearest data center → V8 isolate → response. ~1-3ms overhead.

## Limitations

- HTTP/HTTPS only (no TCP/UDP)
- CPU time limits
- No persistent storage
    `,
  },
  {
    slug: 'understanding-health-checks-deep-dive',
    title: 'Health Checks Deep Dive: How They Actually Work',
    description: 'Technical deep dive into health check mechanisms, thresholds, and failure detection.',
    date: '2026-07-12',
    readTime: '8 min',
    category: 'Deep Dives',
    tags: ['health checks', 'technical', 'deep dive'],
    content: `
## Mechanism

Periodic HTTP request to health endpoint. Success = 200. Failure = 5xx/timeout/refused.

## Thresholds

**Unhealthy:** N consecutive failures before removal.

**Healthy:** N consecutive successes before restoration.

## Failure Types

- 5xx server errors
- Connection refused
- Timeout
- DNS resolution failure

## Timing

| Interval | Detection Time |
|----------|---------------|
| 10s | 20-30s |
| 30s | 60-90s |
| 60s | 120-180s |
    `,
  },
  {
    slug: 'load-balancing-algorithms-deep-dive',
    title: 'Load Balancing Algorithms: How They Work Under the Hood',
    description: 'Round robin, weighted, hash-based, least connections. Technical comparison.',
    date: '2026-07-06',
    readTime: '9 min',
    category: 'Deep Dives',
    tags: ['algorithms', 'technical', 'deep dive'],
    content: `
## Round Robin

Sequential rotation. O(1) per request. No state needed.

## Weighted Round Robin

Weighted random selection. Probabilistic distribution over time.

## IP Hash

Deterministic hash of client IP. Consistent mapping.

## Least Connections

Route to server with fewest active connections. Requires state tracking.

## Trade-offs

| Algorithm | Complexity | State | Fairness |
|-----------|-----------|-------|----------|
| Round Robin | O(1) | None | Equal |
| Weighted | O(1) | None | Proportional |
| IP Hash | O(1) | None | Consistent |
| Least Conn | O(n) | Required | Optimal |
    `,
  },

  // ─── Best Practices ─────────────────────────────────────────────────
  {
    slug: 'health-check-best-practices',
    title: 'Health Check Best Practices',
    description: 'Configure health checks for maximum reliability.',
    date: '2026-08-06',
    readTime: '6 min',
    category: 'Best Practices',
    tags: ['health checks', 'best practices'],
    content: `
## Configuration

- **Interval:** 30s default, 10s critical, 60s non-critical
- **Path:** /health (keep it simple)
- **Threshold:** 2 failures (avoid false positives)

## Do

- Return 200 if service is running
- Keep it lightweight
- Monitor check logs

## Don't

- Query database on health check
- Use threshold of 1 (too aggressive)
- Ignore health check failures
    `,
  },
  {
    slug: 'load-balancer-security-best-practices',
    title: 'Load Balancer Security Best Practices',
    description: 'Secure your load balancer and origins.',
    date: '2026-08-02',
    readTime: '6 min',
    category: 'Best Practices',
    tags: ['security', 'best practices'],
    content: `
## Credentials

- Use OAuth when possible
- Rotate tokens regularly
- Enable two-factor auth

## Transport

- HTTPS only
- TLS 1.2+

## Access Control

- Strong authentication
- Role-based access
- Audit logs

## DDoS

- Cloudflare built-in protection
- Application rate limiting
    `,
  },
  {
    slug: 'performance-optimization-guide',
    title: 'Load Balancer Performance Optimization',
    description: 'Minimize latency, maximize throughput.',
    date: '2026-07-28',
    readTime: '6 min',
    category: 'Best Practices',
    tags: ['performance', 'optimization'],
    content: `
## Origins

- Monitor response times
- Connection pooling
- Keep-alive enabled

## Caching

- Static assets at edge
- API responses when possible
- Proper cache headers

## Monitoring

- P50, P95, P99 latency
- Error rates
- Health status
    `,
  },
  {
    slug: 'choosing-routing-strategy-guide',
    title: 'How to Choose the Right Routing Strategy',
    description: 'Decision guide based on your app type and requirements.',
    date: '2026-07-22',
    readTime: '5 min',
    category: 'Best Practices',
    tags: ['routing strategies', 'decision guide'],
    content: `
## Quick Guide

| App Type | Strategy |
|----------|----------|
| Stateless API | Round Robin |
| Mixed capacity | Weighted |
| Shopping cart | Sticky |
| No cookies | IP Hash |
| Primary + backup | Failover |
| Global users | Geo-steering |
    `,
  },
  {
    slug: 'monitoring-load-balancer',
    title: 'How to Monitor Your Load Balancer',
    description: 'Key metrics, alerting strategies, tools.',
    date: '2026-06-10',
    readTime: '6 min',
    category: 'Best Practices',
    tags: ['monitoring', 'metrics', 'alerting'],
    content: `
## Key Metrics

- Latency (P50, P95, P99)
- Error rate (target < 1%)
- Health status
- Throughput

## Alerts

**Critical:** All origins unhealthy, error rate > 5%

**Warning:** Error rate > 1%, single origin down

## Tools

- Cloudflare Analytics
- Application monitoring (Sentry, DataDog)
- Custom dashboards
    `,
  },

  // ─── Use Cases ──────────────────────────────────────────────────────
  {
    slug: 'api-gateway-with-cloudflare-workers',
    title: 'Building an API Gateway with Cloudflare Workers',
    description: 'Single entry point for all API requests. Route to microservices.',
    date: '2026-08-04',
    readTime: '6 min',
    category: 'Use Cases',
    tags: ['api gateway', 'microservices'],
    content: `
## What is an API Gateway?

Single entry point routing to multiple backend services.

## Why Workers?

- $0 vs $50-500/mo for Kong/AWS API Gateway
- Edge routing (~1-3ms)
- 330+ global locations

## Architecture

User → Edge → Worker → Backend Services

- /api/users → Users Service
- /api/orders → Orders Service
- /api/payments → Payments Service
    `,
  },
  {
    slug: 'multi-region-deployment',
    title: 'Multi-Region Deployment with Cloudflare',
    description: 'Reduce latency, comply with data sovereignty laws.',
    date: '2026-07-30',
    readTime: '7 min',
    category: 'Use Cases',
    tags: ['multi-region', 'gdpr', 'global'],
    content: `
## Why Multi-Region?

- Latency: 5ms vs 150ms
- GDPR: EU data in EU
- Availability: Regional failover

## Setup

1. Deploy origins in each region
2. Configure geo-steering
3. Enable health checks
    `,
  },
  {
    slug: 'ecommerce-load-balancing',
    title: 'E-Commerce Load Balancing',
    description: 'Shopping carts, checkout, payments with sticky sessions.',
    date: '2026-07-25',
    readTime: '6 min',
    category: 'Use Cases',
    tags: ['ecommerce', 'sticky sessions'],
    content: `
## Challenges

- Cart persistence
- Checkout flows
- Payment reliability

## Solution

Sticky sessions for carts. Failover for payments.

## Best Practices

1. Sticky sessions for stateful flows
2. Health checks everywhere
3. Failover for payment processing
    `,
  },
  {
    slug: 'microservices-load-balancing',
    title: 'Microservices Load Balancing',
    description: 'Independent scaling, service isolation, per-service strategies.',
    date: '2026-07-20',
    readTime: '6 min',
    category: 'Use Cases',
    tags: ['microservices', 'architecture'],
    content: `
## Per-Service Load Balancing

Each service gets its own LB:
- Users → Round Robin
- Orders → Weighted
- Payments → Failover

## Benefits

- Independent scaling
- Service isolation
- Strategy flexibility
    `,
  },
  {
    slug: 'saas-multi-tenant-load-balancing',
    title: 'Multi-Tenant SaaS Load Balancing',
    description: 'Tenant isolation, tiered routing, compliance.',
    date: '2026-07-15',
    readTime: '6 min',
    category: 'Use Cases',
    tags: ['saas', 'multi-tenant'],
    content: `
## Strategies

**Shared Pool:** All tenants share origins. Simple.

**Tiered:** Premium tenants get dedicated origins.

**Geographic:** Regional tenants get regional origins.
    `,
  },
  {
    slug: 'high-availability-architecture',
    title: 'High Availability Architecture',
    description: 'Redundancy, failover, monitoring, disaster recovery.',
    date: '2026-07-10',
    readTime: '7 min',
    category: 'Use Cases',
    tags: ['high availability', 'disaster recovery'],
    content: `
## Principles

- Redundancy: No single point of failure
- Failover: Automatic backup activation
- Monitoring: Continuous health checks
- Recovery: Automatic restoration

## Architecture

Users → Edge → Load Balancer → Origins (multiple, multi-region)
    `,
  },
  {
    slug: 'cicd-load-balancer-deployment',
    title: 'CI/CD for Load Balancer Changes',
    description: 'Automated deployments, rollback, testing.',
    date: '2026-07-05',
    readTime: '5 min',
    category: 'Use Cases',
    tags: ['cicd', 'deployment', 'automation'],
    content: `
## Strategies

**Blue-Green:** Deploy new alongside old, switch instantly.

**Canary:** Small % to new version, increase gradually.

**Rolling:** Update one origin at a time.

## Best Practices

1. Version control config
2. Automate everything
3. Test before deploying
4. Keep rollback ready
    `,
  },
  {
    slug: 'websocket-load-balancing',
    title: 'WebSocket Load Balancing',
    description: 'Sticky sessions for real-time connections.',
    date: '2026-07-01',
    readTime: '5 min',
    category: 'Use Cases',
    tags: ['websocket', 'real-time'],
    content: `
## Challenge

WebSocket connections are long-lived. Can't route each message differently.

## Solution

Sticky sessions keep connections on same server.

## Best Practices

1. Use sticky sessions
2. Health checks
3. Client reconnection logic
4. Monitor connection counts
    `,
  },
  {
    slug: 'migrating-from-aws-alb',
    title: 'Migrating from AWS ALB to Cloudflare Workers',
    description: 'Step-by-step. Save 60%+ on load balancing costs.',
    date: '2026-06-25',
    readTime: '7 min',
    category: 'Use Cases',
    tags: ['migration', 'aws', 'cost optimization'],
    content: `
## Steps

1. Document current AWS ALB setup
2. Create EdgeBalancer load balancer
3. Test with subdomain
4. Switch DNS
5. Decommission ALB

## Savings

15M req/mo: $22 → $6.50 (71% reduction)
    `,
  },
  {
    slug: 'load-balancing-for-startups',
    title: 'Load Balancing for Startups',
    description: 'Start free, scale when ready. No infrastructure overhead.',
    date: '2026-06-20',
    readTime: '5 min',
    category: 'Use Cases',
    tags: ['startups', 'free', 'scaling'],
    content: `
## Start Free

- 100k req/day at $0
- No credit card
- 7 strategies
- Health checks included

## Scale

| Traffic | Cost |
|---------|------|
| <100k/day | $0 |
| 500k/day | ~$8/mo |
| 1M/day | ~$11/mo |
    `,
  },
  {
    slug: 'load-balancing-for-saas',
    title: 'SaaS Load Balancing',
    description: 'Multi-tenant routing, scaling strategies.',
    date: '2026-06-15',
    readTime: '6 min',
    category: 'Use Cases',
    tags: ['saas', 'scaling'],
    content: `
## Challenges

Multi-tenancy, isolation, scaling, compliance.

## Strategies

- Shared pool (simple)
- Tiered routing (premium)
- Geographic (compliance)
    `,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
