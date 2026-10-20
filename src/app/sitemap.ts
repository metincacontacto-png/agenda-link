import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://agendalink.cl";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/registro`, lastModified: now, priority: 0.8 },
    { url: `${base}/terminos`, lastModified: now, priority: 0.3 },
    { url: `${base}/privacidad`, lastModified: now, priority: 0.3 },
    { url: `${base}/legal`, lastModified: now, priority: 0.3 },
  ];
}
