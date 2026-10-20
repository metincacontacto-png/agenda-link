import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel", "/api/", "/login"],
      },
    ],
    sitemap: "https://agendalink.cl/sitemap.xml",
  };
}
