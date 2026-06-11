import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://perseoagency.net";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/agency", "/client", "/onboarding", "/auth", "/login"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
