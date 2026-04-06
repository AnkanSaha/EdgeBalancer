import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="text-xl font-bold">EdgeBalancer</span>
            </div>
            <div className="flex items-center gap-4">
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
            
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent mb-6">
              Load Balancing
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>
            
            <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
              Deploy production-ready load balancers to Cloudflare's global network in minutes. 
              No code. No infrastructure. Just results.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 h-auto">
                  Start Free
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                  See Features
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

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32 bg-card/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary">Why EdgeBalancer?</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Everything you need to scale
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Enterprise-grade load balancing without the enterprise complexity
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-primary/20">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <dt className="text-xl font-semibold mb-3">Lightning Fast Deployment</dt>
                <dd className="text-muted-foreground leading-7">
                  Configure and deploy in under 2 minutes. Your load balancer runs on Cloudflare's edge network across 300+ cities worldwide.
                </dd>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-primary/20">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <dt className="text-xl font-semibold mb-3">Zero Infrastructure</dt>
                <dd className="text-muted-foreground leading-7">
                  No servers to manage, no patches to apply. Focus on your application while Cloudflare handles the infrastructure.
                </dd>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-primary/20">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <dt className="text-xl font-semibold mb-3">Smart Placement</dt>
                <dd className="text-muted-foreground leading-7">
                  Automatically runs your Worker closer to origin servers, reducing backend latency and improving response times.
                </dd>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-primary/20">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <dt className="text-xl font-semibold mb-3">Weighted Routing</dt>
                <dd className="text-muted-foreground leading-7">
                  Distribute traffic proportionally across origins. Perfect for blue-green deployments and canary releases.
                </dd>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-primary/20">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <dt className="text-xl font-semibold mb-3">Cost-Effective</dt>
                <dd className="text-muted-foreground leading-7">
                  Fraction of the cost of traditional load balancers. Pay only for what you use with Cloudflare's pricing.
                </dd>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 border-primary/20">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <dt className="text-xl font-semibold mb-3">Secure by Default</dt>
                <dd className="text-muted-foreground leading-7">
                  Your credentials are encrypted with AES-256. Workers deployed to your own Cloudflare account for maximum security.
                </dd>
              </Card>
            </dl>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Unbeatable Value
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Compare the cost of traditional load balancers vs EdgeBalancer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 border-border/40">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">AWS ALB</h3>
                <div className="text-4xl font-bold text-muted-foreground mb-2">$25+</div>
                <div className="text-sm text-muted-foreground">/month</div>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground text-left">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Regional only
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Complex setup
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Additional data costs
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-primary/40 shadow-xl scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Best Value
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">EdgeBalancer</h3>
                <div className="text-4xl font-bold text-primary mb-2">$5</div>
                <div className="text-sm text-muted-foreground">/month</div>
                <ul className="mt-6 space-y-3 text-sm text-left">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Global edge network
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    2-minute setup
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Predictable pricing
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Cloudflare LB</h3>
                <div className="text-4xl font-bold text-muted-foreground mb-2">$5-55</div>
                <div className="text-sm text-muted-foreground">/month</div>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground text-left">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Manual configuration
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Per-check fees
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Complex UI
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Deploy your first load balancer in under 2 minutes
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-12 py-7 h-auto">
                Create Free Account
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • Deploy to your own Cloudflare account
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="font-semibold">EdgeBalancer</span>
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
