import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  };
}
