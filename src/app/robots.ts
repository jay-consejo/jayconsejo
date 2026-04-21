import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// AI training crawlers — blocked. Live-browse crawlers (ChatGPT-User,
// OAI-SearchBot, Claude-Web) are intentionally NOT blocked so the site
// stays discoverable via AI search interfaces at user request.
const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "CCBot",
  "Bytespider",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      ...AI_TRAINING_CRAWLERS.map((agent) => ({
        userAgent: agent,
        disallow: "/",
      })),
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
