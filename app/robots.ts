import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/stories/*"],
      disallow: ["/api/*", "/dashboard/*", "/admin/*", "/auth/*"],
    },
    sitemap: "https://storyvibe.example.com/sitemap.xml",
  };
}
