import { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blogData";

const SITE_URL = "https://edge.nexoral.in";

const staticPages: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/strategies", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/features", changeFrequency: "monthly", priority: 0.9 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/stats", changeFrequency: "weekly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/security", changeFrequency: "yearly", priority: 0.4 },
  { path: "/testimonials", changeFrequency: "monthly", priority: 0.6 },
  { path: "/login", changeFrequency: "monthly", priority: 0.7 },
  { path: "/register", changeFrequency: "monthly", priority: 0.7 },
  { path: "/refund", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cancellation", changeFrequency: "yearly", priority: 0.3 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticEntries = staticPages.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Blog posts
  const blogEntries = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
