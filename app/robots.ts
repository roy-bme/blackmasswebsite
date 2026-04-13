import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://blackmass.co.uk/sitemap.xml",
    host: "https://blackmass.co.uk",
  };
}
