import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { isIndabaHost } from "@/lib/ops/host-allowlist";

// Only the marketing host has a public sitemap. The indaba portal returns
// an empty sitemap so portal URLs never surface in a crawler's index.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = headers().get("host");
  if (isIndabaHost(host)) return [];

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
