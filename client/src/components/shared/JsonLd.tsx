/**
 * JSON-LD structured data for SEO.
 * Rendered as a <script type="application/ld+json"> tag.
 */

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EdgeBalancer",
    url: "https://edge.nexoral.in",
    description:
      "Deploy and manage Cloudflare Worker-based load balancers through an intuitive visual dashboard.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://edge.nexoral.in/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "EdgeBalancer",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      "Deploy Cloudflare Worker-based load balancers in under 90 seconds. 7 routing strategies, health checks, per-origin traffic weighting. No code required.",
    url: "https://edge.nexoral.in",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "7 routing strategies (round-robin, weighted, IP hash, cookie sticky, failover, geo-steering)",
      "Health checks with automatic failover",
      "Per-origin traffic weighting",
      "Deploy in under 90 seconds",
      "Cloudflare Workers edge deployment",
      "Visual dashboard — no code required",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQPageSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
