import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { isIndabaHost } from "@/lib/ops/host-allowlist";

// Served from both hostnames. We vary the response by Host header:
//   - indaba.zimx.io (or any allowed indaba host) → disallow everything
//   - otherwise (marketing or unknown)            → allow everything
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const host = headers().get("host");

  if (isIndabaHost(host)) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://blackmass.co.uk/sitemap.xml",
    host: "https://blackmass.co.uk",
  };
}
