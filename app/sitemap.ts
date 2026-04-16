import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// Only the marketing host has a public sitemap. The indaba portal is private
// and returns an empty sitemap to avoid leaking portal URLs or pointing
// crawlers at blackmass.co.uk entries from the indaba hostname.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = headers().get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const isIndaba = hostname === "indaba" || hostname.startsWith("indaba.");

  if (isIndaba) return [];

  const base = "https://blackmass.co.uk";
  const lastModified = new Date();

  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${base}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/press`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/contact`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
