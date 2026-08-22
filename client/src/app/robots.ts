import { MetadataRoute } from "next";
const BASE_URL = "https://edge.nexoral.in";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/login", "/register", "/blog", "/strategies", "/pricing", "/faq", "/contact", "/privacy", "/terms", "/refund", "/cancellation", "/security", "/features", "/stats"], disallow: ["/settings", "/loadbalancers", "/gateways", "/onboarding", "/sessions", "/overview", "/ai-runs", "/payments", "/pro"] },
      { userAgent: "GPTBot", allow: ["/"] },
      { userAgent: "PerplexityBot", allow: ["/"] },
      { userAgent: "ClaudeBot", allow: ["/"] },
      { userAgent: "Google-Extended", allow: ["/"] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
