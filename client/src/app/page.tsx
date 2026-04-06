'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="text-xl font-bold">EdgeBalancer</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Powered by Cloudflare Workers
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent mb-6 leading-tight">
              Load Balancing <br />
              <span className="text-primary">for Solo Developers</span>
            </h1>
            
            <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
              Deploy global load balancers to 300+ cities in seconds. 
              Save hundreds of dollars compared to traditional providers.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 h-auto">
                  Start for $2/mo
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                  Compare Savings
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary">300+</div>
                <div className="text-sm text-muted-foreground mt-1">Edge Locations</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">&lt;50ms</div>
                <div className="text-sm text-muted-foreground mt-1">Global Latency</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">99.99%</div>
                <div className="text-sm text-muted-foreground mt-1">Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solo Dev focus Section */}
      <section className="py-24 bg-card/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-base font-semibold leading-7 text-primary">Optimized for Small Scale</h2>
              <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
                Why pay for idle infrastructure?
              </p>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                AWS ALB and Google Cloud charge you <strong>$18-$25 every month</strong> just to keep a load balancer running, even with zero traffic. 
                EdgeBalancer leverages Cloudflare Workers to give you elite performance at a fraction of the cost.
              </p>
              
              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-background border border-border/50 rounded-2xl">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">✓</div>
                  <div className="text-foreground font-medium">100,000 Free Requests every single day</div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-background border border-border/50 rounded-2xl">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">✓</div>
                  <div className="text-foreground font-medium">Just $2/month for EdgeBalancer management</div>
                </div>
              </div>
            </div>

            <Card className="p-0 overflow-hidden border-primary/20 shadow-2xl bg-card">
              <div className="bg-primary/10 p-6 border-b border-border/50">
                <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
                  Cloudflare Workers Limits
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="p-4 font-semibold text-foreground">Feature</th>
                      <th className="p-4 font-semibold text-foreground">Free Tier</th>
                      <th className="p-4 font-semibold text-primary">Paid ($5/mo)</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground font-medium">
                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">Requests</td>
                      <td className="p-4">100,000 / day</td>
                      <td className="p-4 text-primary">Unlimited*</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">CPU Time</td>
                      <td className="p-4">10ms / request</td>
                      <td className="p-4">up to 5 min</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">Memory</td>
                      <td className="p-4">128 MB</td>
                      <td className="p-4">128 MB</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">Concurrent Conn.</td>
                      <td className="p-4">6</td>
                      <td className="p-4">10,000+</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">Max Workers</td>
                      <td className="p-4">100</td>
                      <td className="p-4">500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-primary/5 text-primary text-xs font-semibold text-center">
                * Cloudflare Paid plan is billed directly by Cloudflare.
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Massive Savings for Small Traffic
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Compare the monthly base price of idle load balancers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {/* AWS */}
            <Card className="p-8 border-border/40 bg-card/50">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">AWS ALB</h3>
                <div className="text-4xl font-bold text-muted-foreground mb-2">$18 - $25</div>
                <div className="text-sm text-muted-foreground">/month base</div>
                <ul className="mt-8 space-y-4 text-sm text-muted-foreground text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">✕</span> Regional only
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">✕</span> LCU capacity charges
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">✕</span> Complex IAM setup
                  </li>
                </ul>
              </div>
            </Card>

            {/* EdgeBalancer */}
            <Card className="p-10 border-primary shadow-xl bg-card relative scale-110 z-10 border-2">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Best for Solo Devs
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-foreground">EdgeBalancer</h3>
                <div className="text-5xl font-bold text-primary mb-2">$2</div>
                <div className="text-sm text-muted-foreground font-medium">/month per LB</div>
                <ul className="mt-8 space-y-4 text-sm text-left font-medium">
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> Global Anycast Network
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> Free 100k daily reqs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> Integrated WAF Security
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> Instant Pause/Resume
                  </li>
                </ul>
                <Link href="/register" className="mt-8 block">
                  <Button className="w-full shadow-lg shadow-primary/20 h-12 text-base font-bold">Deploy Now</Button>
                </Link>
              </div>
            </Card>

            {/* Google Cloud */}
            <Card className="p-8 border-border/40 bg-card/50">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Google Cloud</h3>
                <div className="text-4xl font-bold text-muted-foreground mb-2">$18+</div>
                <div className="text-sm text-muted-foreground">/month base</div>
                <ul className="mt-8 space-y-4 text-sm text-muted-foreground text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">✕</span> Proxy instance costs
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">✕</span> Forwarding rule fees
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">✕</span> Ingress/Egress billing
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground mb-6">
            Scale Smarter, Not Harder
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Stop overpaying for idle load balancers. Deploy to the edge for just $2/mo.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-12 py-7 h-auto font-bold shadow-xl shadow-primary/20">
              Create Your First Balancer
            </Button>
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">
            No hidden fees • Transparent Cloudflare Integration
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="font-bold">EdgeBalancer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 EdgeBalancer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
