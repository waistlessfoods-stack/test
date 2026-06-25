import type { MetadataRoute } from "next";

export const revalidate = 300;

function getBaseUrl(): string {
  return "https://www.waistlessfoods.com";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  const isPreview = process.env.VERCEL_ENV === "preview";

  if (isPreview) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/services",
          "/shop",
          "/recipes",
          "/recipes/detail/",
          "/blog",
          "/links",
        ],
        disallow: [
          "/admin/",
          "/account",
          "/orders",
          "/signin",
          "/signup",
          "/sso-callback/",
          "/stripe-test",
          "/api/",
          "/blogs",
          "/recipes/detail/*/full",
          "/recipes/*?*",
          "/*?*redirect=*",
          "/*?*message=*",
          "/*?*success=*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
