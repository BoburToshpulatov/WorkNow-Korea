import type { MetadataRoute } from "next";
import { env, isProduction } from "@/lib/env";

// Evaluate at request time so it always reflects the running APP_ENV.
export const dynamic = "force-dynamic";

/** Only production is indexable; staging/dev are hidden from search engines. */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/worker", "/employer", "/dashboard", "/j/"],
    },
    host: env.appUrl,
  };
}
