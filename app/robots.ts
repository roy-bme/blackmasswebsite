import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// Served from both hostnames, so we vary the response by Host header:
//   - blackmass.co.uk  →  allow everything, point to the marketing sitemap
//   - indaba.zimx.io   →  disallow everything (also enforced via
//                          X-Robots-Tag in middleware.ts as belt-and-braces)
//
// Marking as force-dynamic so Next.js doesn't try to prerender a single
// static response at build time.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const host = headers().get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const isIndaba = hostname === "indaba" || hostname.startsWith("indaba.");

  if (isIndaba) {
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
