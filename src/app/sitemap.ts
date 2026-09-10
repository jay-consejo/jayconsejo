import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { publishedWork } from "@/lib/work";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteConfig.url, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteConfig.url}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...publishedWork.map((w) => ({
      url: `${siteConfig.url}/work/${w.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${siteConfig.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
