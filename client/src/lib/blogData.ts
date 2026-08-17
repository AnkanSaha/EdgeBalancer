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
];

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-load-balance-cloudflare-workers',
    title: 'How to Load Balance Cloudflare Workers in 2026',
    description: 'A complete guide to load balancing Cloudflare Workers. Learn how to distribute traffic across multiple origins with health checks, failover, and zero downtime.',
    date: '2026-08-10',
    readTime: '8 min',
    category: 'Tutorials',
    tags: ['cloudflare workers', 'load balancing', 'tutorial', 'edge computing'],
    content: `
## What is Cloudflare Workers Load Balancing?

Cloudflare Workers run at the edge — on 330+ data centers worldwide. When you load balance with Workers, your traffic routing decisions happen at the edge, not at a centralized load balancer. This means lower latency, no single point of failure, and automatic global distribution.

Traditional load balancers (AWS ALB, Nginx, HAProxy) sit between your users and your servers. Workers-based load balancing replaces that with a lightweight script that runs at every Cloudflare data center.

## Why Use Workers Instead of Traditional Load Balancers?

**Cost:** A traditional AWS ALB costs ~$22/month before any traffic. Cloudflare Workers cost $0 under 100k requests/day, and ~$8/month at 15M requests/month.

**Latency:** Traditional load balancers add 5-20ms of latency because traffic routes through a centralized point. Workers add ~1-3ms because they run at the edge closest to your user.

**Global distribution:** A traditional load balancer serves from one region. Workers automatically serve from the closest Cloudflare data center — no configuration needed.

**No idle fees:** AWS ALB charges by the hour even at zero traffic. Workers charge only per request. No traffic = $0.

## Step-by-Step: Deploy a Load Balancer

### 1. Connect Your Cloudflare Account

Sign in to EdgeBalancer and connect your Cloudflare account via OAuth or API token. This takes 30 seconds.

### 2. Choose a Routing Strategy

EdgeBalancer offers 7 strategies:

- **Round Robin** — Equal distribution across all origins
- **Weighted Round Robin** — Proportional distribution based on server capacity
- **IP Hash** — Same visitor always hits the same server
- **Sticky Sessions** — Cookie-based session persistence
- **Failover** — Primary-backup with automatic recovery
- **Geographic Routing** — Route by visitor location

### 3. Add Your Origin Servers

Enter the URLs of your backend servers. For example:

\`\`\`
https://api-us-east.example.com
https://api-eu-west.example.com
https://api-ap-south.example.com
\`\`\`

### 4. Deploy

Click deploy. EdgeBalancer generates a Worker script, pushes it to your Cloudflare account, and attaches your domain. Total time: ~90 seconds.

## How Health Checks Work

EdgeBalancer runs periodic health checks to each origin. If an origin returns a 5xx error, times out, or refuses connections, it is automatically removed from rotation. When it recovers, traffic resumes.

Health check intervals are configurable from 10 seconds to 5 minutes. Each check uses a configurable path (e.g., \`/health\`) and expects a 200 status code.

## What Happens if EdgeBalancer Goes Down?

Nothing. Your load balancers keep running. The Worker script lives in your Cloudflare account — EdgeBalancer is only the control plane for creating and managing configurations. If EdgeBalancer is temporarily unavailable, your existing load balancers continue to serve traffic normally.

## Performance Impact

Workers add ~1-3ms median overhead per request. This is significantly less than a traditional centralized load balancer, which typically adds 5-20ms. The edge-level execution means the routing decision happens at the same data center that serves the request.

## Cost Comparison

| Traffic | AWS ALB | Cloudflare Workers |
|---------|---------|-------------------|
| 10k req/day | ~$22/month | $0 (free tier) |
| 100k req/day | ~$22/month | $0 (free tier) |
| 500k req/day | ~$25/month | ~$8/month |
| 1M req/day | ~$30/month | ~$11/month |

## Next Steps

- [Compare all 7 routing strategies](/strategies)
- [See pricing details](/pricing)
- [Deploy your first load balancer](/register)
    `,
  },
  {
    slug: 'cloudflare-workers-vs-aws-alb-cost-comparison',
    title: 'Cloudflare Workers vs AWS ALB: 2026 Cost Comparison',
    description: 'Detailed cost comparison between Cloudflare Workers load balancing and AWS Application Load Balancer. Real numbers at different traffic levels.',
    date: '2026-08-08',
    readTime: '6 min',
    category: 'Comparisons',
    tags: ['aws', 'cloudflare', 'cost comparison', 'load balancer pricing'],
    content: `
## The Short Answer

At 15M requests/month, Cloudflare Workers costs ~$8/month. AWS ALB costs ~$22/month. That's a 64% saving. Under 100k requests/day (3M/month), Workers are completely free.

## How AWS ALB Pricing Works

AWS Application Load Balancer charges three things:

1. **Hourly rate:** $0.0225/hour = $16.43/month (always charged, even at zero traffic)
2. **LCU usage:** $0.008 per LCU-hour (based on new connections, active connections, bandwidth, and rule evaluations)
3. **Data transfer:** $0.09/GB for data leaving AWS

For a typical small API (~1 LCU/hr steady, 15M requests/month):

| Component | Cost |
|-----------|------|
| Base hourly (730h × $0.0225) | $16.43 |
| LCU usage (1 × $0.008 × 730h) | $5.84 |
| **Total** | **$22.27/month** |

This does not include EC2 target costs, data egress, or cross-AZ transfer fees.

## How Cloudflare Workers Pricing Works

Workers charge two things:

1. **Subscription:** $5/month for Workers Paid (includes 10M requests + 30M CPU-ms)
2. **Overage:** $0.30 per million requests beyond the included 10M

For 15M requests/month:

| Component | Cost |
|-----------|------|
| Workers Paid subscription | $5.00 |
| Overage (5M × $0.30/M) | $1.50 |
| CPU time (within included 30M-ms) | $0.00 |
| **Total** | **$6.50/month** |

No idle fees. No egress fees. No cross-region transfer.

## The Free Tier Difference

AWS ALB free tier lasts 12 months. After that, you pay $16.43/month minimum — even at zero traffic.

Cloudflare Workers free tier is permanent: 100k requests/day (3M/month), forever, no credit card required.

## At Different Traffic Levels

| Monthly Requests | AWS ALB | CF Workers | Savings |
|-----------------|---------|------------|---------|
| 300k (free tier) | $22.27 | $0 | 100% |
| 3M | $22.27 | $0 | 100% |
| 15M | $22.27 | $6.50 | 71% |
| 30M | $25.00 | $11.00 | 56% |
| 100M | $45.00 | $32.00 | 29% |

## Hidden Costs of AWS ALB

The numbers above are conservative. Real AWS ALB costs often include:

- **Cross-AZ transfer:** $0.01/GB for traffic crossing availability zones
- **Data egress:** $0.09/GB for traffic leaving AWS
- **WAF integration:** Additional $0.60/month + $1.00 per million requests
- **CloudWatch monitoring:** Additional cost for detailed metrics
- **Idle capacity:** You pay for provisioned capacity even when unused

## When AWS ALB Makes Sense

AWS ALB is still the right choice when:

- You need deep AWS ecosystem integration (ECS, EKS, Lambda)
- You require WebSocket support at the load balancer level
- You need advanced routing rules beyond what Workers support
- You are already committed to AWS infrastructure

## When Cloudflare Workers Make Sense

Workers are the better choice when:

- You want the lowest possible cost
- You need global edge-level routing
- You want zero cold starts
- You are building on Cloudflare's ecosystem
- You want to avoid idle fees and egress charges
- You need to deploy quickly (90 seconds vs 10-30 minutes)

## Try It Yourself

[Deploy a Cloudflare Workers load balancer for free →](/register)

Under 100k requests/day, it costs $0. No credit card required.
    `,
  },
  {
    slug: 'cloudflare-worker-routing-strategies-explained',
    title: '7 Cloudflare Worker Routing Strategies Explained',
    description: 'Complete guide to all 7 load balancing strategies for Cloudflare Workers. Round robin, weighted, IP hash, sticky sessions, failover, and geo-steering.',
    date: '2026-08-05',
    readTime: '10 min',
    category: 'Deep Dives',
    tags: ['routing strategies', 'cloudflare workers', 'load balancing', 'edge computing'],
    content: `
## Overview

EdgeBalancer provides 7 routing strategies for Cloudflare Workers. Each strategy is designed for different use cases. This guide explains how each one works, when to use it, and when to avoid it.

## 1. Round Robin

**How it works:** Each request goes to the next origin in the list, cycling through all origins in order.

**Best for:** Stateless APIs, microservices with equal capacity servers.

**Avoid when:** Servers have different capacities or you need session persistence.

**Technical details:**
- Overhead: ~0ms
- Failover: No
- Sticky: No

## 2. Weighted Round Robin

**How it works:** Each origin is assigned a weight. Traffic is distributed proportionally to weights.

**Example:** Origin A (weight: 60), Origin B (weight: 30), Origin C (weight: 10). Over time, A gets 60% of traffic, B gets 30%, C gets 10%.

**Best for:** Mixed server capacities, gradual rollouts, A/B testing.

**Avoid when:** All servers are identical (use round robin instead).

**Technical details:**
- Overhead: ~0ms
- Failover: No
- Sticky: No

## 3. IP Hash

**How it works:** The client's IP address is hashed to determine which origin they hit. Same IP always maps to the same origin.

**Best for:** CDN cache warming, API consumers expecting consistent routing, environments where cookies are not available.

**Avoid when:** Many users share the same IP (corporate NAT, VPNs).

**Technical details:**
- Overhead: ~0ms
- Failover: No
- Sticky: Yes (by IP)

## 4. Sticky Sessions (Cookie-Based)

**How it works:** First request picks an origin and sets a cookie. Subsequent requests use the cookie to route to the same origin.

**Best for:** Shopping carts, login sessions, WebSocket connections, traditional server-rendered apps.

**Avoid when:** Application is fully stateless, cookie-based routing conflicts with CDN caching.

**Technical details:**
- Overhead: ~1ms
- Failover: Yes (re-picks if origin is down)
- Sticky: Yes (by cookie)

## 5. Weighted Sticky Sessions

**How it works:** Combines weighted distribution with cookie-based session persistence. New visitors are distributed by weight, then pinned via cookie.

**Best for:** Stateful applications with servers of different capacity.

**Avoid when:** Application is stateless.

**Technical details:**
- Overhead: ~1ms
- Failover: Yes (re-picks if origin is down)
- Sticky: Yes (by cookie)

## 6. Failover

**How it works:** All traffic goes to the primary origin. If it fails (5xx, timeout, connection refused), traffic routes to the next origin in the list. When the primary recovers, traffic returns.

**Best for:** Primary/backup setups, disaster recovery, high availability.

**Avoid when:** You want traffic distributed across all origins.

**Technical details:**
- Overhead: ~2ms (on failover only)
- Failover: Yes (automatic)
- Sticky: No

## 7. Geographic Routing (Geo-Steering)

**How it works:** Routes visitors to the origin closest to their physical location. Matches by city first, then country, then continent, with a fallback rotation.

**Best for:** GDPR compliance, latency optimization, regional content, multi-continent deployments.

**Avoid when:** All origins are in the same region.

**Technical details:**
- Overhead: ~1ms
- Failover: Yes (fallback rotation)
- Sticky: No

## How to Choose

| Your Situation | Strategy |
|---------------|----------|
| Stateless APIs, equal servers | Round Robin |
| Different server capacities | Weighted Round Robin |
| Need consistent routing without cookies | IP Hash |
| Shopping carts, login sessions | Sticky Sessions |
| Stateful + mixed capacity | Weighted Sticky Sessions |
| Primary + backup servers | Failover |
| Global users, data sovereignty | Geographic Routing |

## Switching Strategies

You can switch strategies at any time without downtime. The change takes effect immediately for new requests. Existing sticky sessions are preserved until the cookie expires.

[Compare strategies in detail →](/strategies)
    `,
  },
  {
    slug: 'free-load-balancer-for-cloudflare-workers',
    title: 'Free Load Balancer for Cloudflare Workers (2026)',
    description: 'How to set up a free load balancer for Cloudflare Workers. 100k requests/day at $0, no credit card required. Health checks and failover included.',
    date: '2026-08-03',
    readTime: '5 min',
    category: 'Getting Started',
    tags: ['free', 'cloudflare workers', 'load balancer', 'getting started'],
    content: `
## Is It Really Free?

Yes. Under 100k requests/day (3M/month), Cloudflare Workers cost $0. EdgeBalancer is free to use. No credit card required. No trial period. No surprise charges.

## What You Get for Free

- 100k requests/day (3M/month)
- 7 routing strategies
- Health checks with automatic failover
- Unlimited load balancers
- AES-256-GCM encrypted credentials
- OAuth connection to Cloudflare
- Deployment history and rollback

## How to Set Up (3 Steps)

### Step 1: Sign Up

Go to [EdgeBalancer](/register) and sign in with Google. Takes 10 seconds.

### Step 2: Connect Cloudflare

Click "Connect with Cloudflare" and authorize EdgeBalancer via OAuth. No need to create API tokens manually.

### Step 3: Deploy

Click "Create Load Balancer," add your origin servers, choose a strategy, and deploy. The Worker is live in ~90 seconds.

## What Happens After Deployment

The Worker script runs in your Cloudflare account on 330+ data centers worldwide. Each request is routed at the edge — no centralized load balancer, no single point of failure.

If an origin goes down, the Worker automatically routes to a healthy origin. Health checks run every 30 seconds (configurable).

## Common Questions

**What if I exceed 100k requests/day?**
Cloudflare bills $0.30 per million requests. You can set spending limits in your Cloudflare dashboard.

**Do I need to provide a credit card?**
No. The free tier requires no payment information.

**Can I upgrade later?**
Yes. When you need more than 100k requests/day, upgrade to Cloudflare Workers Paid ($5/month). EdgeBalancer remains free.

**Is my traffic proxied through EdgeBalancer?**
No. Traffic flows directly from Cloudflare edge to your origins. EdgeBalancer never sees your production traffic.

## Performance

- Latency overhead: ~1-3ms (edge-level routing)
- Cold start: 0ms (V8 isolates, not containers)
- Global coverage: 330+ Cloudflare data centers
- Uptime: Backed by Cloudflare's 99.99% SLA

## Next Steps

- [See all routing strategies](/strategies)
- [Compare pricing](/pricing)
- [Read the FAQ](/faq)
- [Deploy your first load balancer →](/register)
    `,
  },
  {
    slug: 'cloudflare-health-checks-and-failover',
    title: 'Cloudflare Workers Health Checks and Automatic Failover',
    description: 'How health checks and automatic failover work with Cloudflare Workers load balancing. Keep your origins healthy with zero downtime.',
    date: '2026-07-30',
    readTime: '7 min',
    category: 'Deep Dives',
    tags: ['health checks', 'failover', 'high availability', 'cloudflare workers'],
    content: `
## Why Health Checks Matter

Without health checks, your load balancer sends traffic to dead servers. Users see 502 errors, timeouts, or broken pages. Health checks detect failures automatically and remove unhealthy origins from rotation — before your users notice.

## How EdgeBalancer Health Checks Work

EdgeBalancer runs periodic health checks to each origin server. Each check:

1. Sends an HTTP request to the configured health path (e.g., \`/health\`)
2. Waits for a response (configurable timeout)
3. If the response is 200 OK → origin is healthy
4. If the response is 5xx, timeout, or connection refused → origin is unhealthy

### Health Check Configuration

| Setting | Default | Range |
|---------|---------|-------|
| Interval | 30 seconds | 10s - 5m |
| Path | /health | Any path |
| Timeout | 5 seconds | 1-30s |
| Unhealthy threshold | 2 failures | 1-5 |
| Healthy threshold | 2 successes | 1-5 |

## Automatic Failover

When a health check marks an origin as unhealthy, the load balancer automatically removes it from rotation. Traffic is redistributed across remaining healthy origins.

When the origin recovers (health checks pass again), it is added back to rotation automatically. No manual intervention needed.

### Failover Timeline

| Event | Time |
|-------|------|
| Origin fails | 0s |
| First health check fails | 0-30s (depending on interval) |
| Second health check fails | 30-60s |
| Origin removed from rotation | ~60s total |
| Origin recovers | Varies |
| First healthy check | 0-30s after recovery |
| Second healthy check | 30-60s after recovery |
| Origin added back | ~60s after recovery |

## Health Check Strategies

### For APIs
Use a lightweight endpoint that returns 200 if the service is running:
\`\`\`
GET /health → 200 OK
\`\`\`

### For Databases
Check database connectivity in the health endpoint:
\`\`\`
GET /health → 200 if DB is connected, 503 if not
\`\`\`

### For Full Stack
Check critical dependencies:
\`\`\`
GET /health → 200 if all services are up
\`\`\`

## Best Practices

1. **Keep health checks lightweight.** A health check that queries your database adds load. Use a simple endpoint that returns 200.

2. **Set appropriate intervals.** 30 seconds is a good default. Use 10 seconds for critical services, 60 seconds for non-critical.

3. **Use the unhealthy threshold.** Don't remove an origin on a single failed check. Use 2-3 failures to avoid false positives.

4. **Monitor health check logs.** EdgeBalancer logs all health check results. Use this to identify patterns (e.g., an origin failing every night during backups).

5. **Test failover.** Periodically take an origin offline and verify that traffic routes correctly to remaining origins.

## Cost

Health checks are included in EdgeBalancer at no additional cost. They run as Worker requests, so they count toward your Cloudflare Workers quota. At 30-second intervals with 5 origins, that's ~14,400 requests/day — well within the free tier.

## Next Steps

- [Learn about routing strategies](/strategies)
- [See pricing](/pricing)
- [Deploy with health checks →](/register)
    `,
  },
  {
    slug: 'geo-steering-cloudflare-workers',
    title: 'Geographic Routing with Cloudflare Workers: A Complete Guide',
    description: 'How to implement geographic routing (geo-steering) with Cloudflare Workers. Route users to the nearest origin for minimum latency and GDPR compliance.',
    date: '2026-07-25',
    readTime: '7 min',
    category: 'Tutorials',
    tags: ['geo-steering', 'geographic routing', 'cloudflare workers', 'gdpr', 'latency'],
    content: `
## What is Geographic Routing?

Geographic routing (geo-steering) sends each user to the origin server closest to their physical location. If you have servers in the US, Europe, and Asia, a user from Berlin hits the European server, a user from Mumbai hits the Asian server, and a user from New York hits the US server.

## Why Use Geo-Steering?

### Lower Latency
A request from Tokyo to a US server takes ~150ms. The same request to a Tokyo server takes ~5ms. Geo-steering eliminates this cross-continent latency.

### GDPR Compliance
European user data can stay in European servers. Geo-steering ensures EU users never route to US or Asian origins, helping with data residency requirements.

### Regional Content
Serve region-specific content (language, currency, catalog) based on the user's location without client-side redirects.

## How EdgeBalancer Geo-Steering Works

When a request arrives at a Cloudflare data center, the Worker checks:

1. **City match** — Is there an origin configured for this city?
2. **Country match** — Is there an origin configured for this country?
3. **Continent match** — Is there an origin configured for this continent?
4. **Fallback** — No match? Use round-robin across all origins.

### Configuration Example

\`\`\`
Origins:
  - https://api-us.example.com  → Countries: US, CA, MX
  - https://api-eu.example.com  → Countries: DE, FR, GB, NL, IT, ES
  - https://api-asia.example.com → Countries: IN, JP, KR, SG, AU
\`\`\`

A user from Germany hits \`api-eu.example.com\`. A user from Japan hits \`api-asia.example.com\`. A user from Brazil (no match) gets round-robin across all three.

## Use Cases

### Multi-Region API
Deploy your API in 3 regions. Geo-steering routes each client to the nearest region. Users in Asia no longer wait for US servers to respond.

### Data Sovereignty
Keep European data in European servers. Geo-steering ensures EU users never route outside Europe, helping with GDPR and data residency laws.

### CDN Origin Selection
If you run a CDN with origins in multiple regions, geo-steering selects the closest origin for cache fills. This reduces origin latency and cache miss times.

## Performance Impact

Geo-steering adds ~1ms of overhead for the location lookup. This is negligible compared to the 50-150ms saved by routing to a closer origin.

## Limitations

- **VPN users:** VPNs mask the real location. A user in India using a US VPN will be routed to the US origin.
- **Corporate NAT:** Users behind corporate NAT may appear to be in a different location.
- **City-level accuracy:** City matching uses Cloudflare's colo data, which may not always match the user's exact city.

## Combining with Health Checks

Geo-steering works with health checks. If the closest origin is unhealthy, the Worker falls back to the next closest origin. Users always get a response, even if their regional server is down.

## Cost

Geo-steering is included in all EdgeBalancer plans at no additional cost. It runs as a Worker script, so it counts toward your Cloudflare Workers quota.

## Next Steps

- [Compare all routing strategies](/strategies)
- [Deploy with geo-steering →](/register)
    `,
  },
  {
    slug: 'cookie-sticky-sessions-cloudflare-workers',
    title: 'Cookie Sticky Sessions on Cloudflare Workers',
    description: 'How to implement cookie-based sticky sessions with Cloudflare Workers. Keep users on the same origin for shopping carts, logins, and WebSockets.',
    date: '2026-07-20',
    readTime: '6 min',
    category: 'Tutorials',
    tags: ['sticky sessions', 'cookies', 'cloudflare workers', 'session persistence'],
    content: `
## What Are Sticky Sessions?

Sticky sessions (session affinity) ensure that a user's requests always go to the same backend server. This is essential for applications that store session state on the server — shopping carts, login sessions, in-progress forms, WebSocket connections.

Without sticky sessions, a user might add items to a cart on Server A, and their next request goes to Server B — where the cart is empty.

## How Cookie-Based Sticky Sessions Work

EdgeBalancer's sticky session strategy uses a cookie (\`eb_lb\`) to track which origin a user is assigned to.

### First Request
1. User visits your site
2. Worker picks an origin (round-robin or weighted)
3. Worker routes the request to that origin
4. Worker sets a cookie: \`eb_lb=0\` (origin index)

### Subsequent Requests
1. User makes another request
2. Worker reads the \`eb_lb\` cookie
3. Worker routes to the same origin

### Origin Failure
If the pinned origin is down:
1. Worker detects the failure (5xx, timeout, connection refused)
2. Worker picks a new healthy origin
3. Worker updates the cookie with the new origin index
4. User's session continues on the new origin

## Use Cases

### Shopping Carts
Items are stored in server-side sessions. Sticky sessions keep the user on the same server so their cart persists across page loads.

### Login Sessions
Session tokens are stored in server memory. Sticky sessions ensure the user stays logged in.

### WebSocket Connections
WebSocket connections are long-lived. Sticky sessions keep the connection on the same server for the duration.

### In-Progress Work
Multi-step forms, file uploads, or wizard flows that store intermediate state on the server.

## Configuration

In EdgeBalancer, select "Sticky Sessions" as your routing strategy. Add your origin servers. The cookie is set automatically by the Worker.

### Cookie Details

| Property | Value |
|----------|-------|
| Name | eb_lb |
| HttpOnly | Yes |
| Secure | Yes (HTTPS only) |
| SameSite | Lax |
| Path | / |
| Expiry | Session (browser close) |

## Limitations

- **Stateless apps don't need it.** If your application stores state in a database or Redis, use round-robin instead.
- **CDN caching conflicts.** Cookie-based routing may bypass CDN cache. If you use a CDN in front of your origins, consider IP-hash instead.
- **Initial imbalance.** The first request distribution is round-robin. Over time, some servers may have more sticky users than others.

## Weighted Sticky Sessions

If your servers have different capacities, use "Weighted Sticky Sessions." New visitors are distributed by weight (bigger servers get more), and then pinned via cookie.

## Next Steps

- [Compare all routing strategies](/strategies)
- [Deploy with sticky sessions →](/register)
    `,
  },
  {
    slug: 'deploy-load-balancer-in-90-seconds',
    title: 'Deploy a Cloudflare Load Balancer in 90 Seconds',
    description: 'Step-by-step guide to deploying a production load balancer on Cloudflare Workers in under 90 seconds. No DevOps, no servers, no configuration files.',
    date: '2026-07-15',
    readTime: '4 min',
    category: 'Getting Started',
    tags: ['quick start', 'deployment', 'cloudflare workers', 'tutorial'],
    content: `
## What You Need

- A Cloudflare account with at least one domain
- 90 seconds

That's it. No servers to provision. No configuration files to write. No DevOps knowledge required.

## Step 1: Sign In (10 seconds)

Go to [EdgeBalancer](/register) and click "Sign in with Google." You're in.

## Step 2: Connect Cloudflare (20 seconds)

Click "Connect with Cloudflare." You'll be redirected to Cloudflare to authorize EdgeBalancer. Click "Authorize." Done.

EdgeBalancer requests only the permissions it needs:
- Workers Scripts: Edit (deploy Workers)
- Zone: Read (list your domains)
- DNS: Edit (create records for IP-based origins)
- Account Analytics: Read (show metrics)

## Step 3: Create Load Balancer (30 seconds)

Click "Create Load Balancer" and fill in:

1. **Name:** A name for your load balancer (e.g., \`my-api\`)
2. **Domain:** Select from your Cloudflare zones
3. **Origins:** Add your backend server URLs
4. **Strategy:** Choose a routing strategy

Example origins:
\`\`\`
https://api-server-1.example.com
https://api-server-2.example.com
\`\`\`

## Step 4: Deploy (30 seconds)

Click "Deploy." EdgeBalancer:
1. Generates a Worker script from the strategy template
2. Uploads it to your Cloudflare account
3. Attaches your domain to the Worker
4. Saves the configuration to MongoDB

Total time: ~90 seconds from start to finish.

## What Just Happened?

A Worker script is now running on 330+ Cloudflare data centers worldwide. When a user visits your domain, the request hits the nearest data center, the Worker executes, and routes the request to one of your origin servers.

The Worker:
- Routes requests based on your chosen strategy
- Health checks your origins every 30 seconds
- Automatically fails over to healthy origins
- Adds ~1-3ms of latency (edge-level execution)

## Verify It's Working

Visit your domain in a browser. You should see your origin server's response. Check the response headers for Cloudflare-specific headers like \`cf-ray\` and \`server: cloudflare\`.

## What's Next?

- [Learn about routing strategies](/strategies)
- [Set up health checks](/faq)
- [Compare pricing](/pricing)

## Common Questions

**Can I change the strategy later?**
Yes. Edit the load balancer, select a new strategy, and redeploy. No downtime.

**Can I add more origins later?**
Yes. Edit the load balancer, add origins, and redeploy.

**What if I need to roll back?**
EdgeBalancer keeps deployment history. Roll back to any previous version with one click.

**How much does it cost?**
Under 100k requests/day, $0. See [pricing](/pricing) for details.
    `,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
