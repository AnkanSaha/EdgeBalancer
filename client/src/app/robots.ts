import { MetadataRoute } from "next";

const BASE_URL = "https://edge.nexoral.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/blog", "/strategies", "/pricing", "/faq", "/contact", "/privacy", "/terms"],
        disallow: ["/dashboard", "/settings", "/loadbalancers", "/onboarding", "/sessions"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap/sitemap.xml`,
  };
}
