import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/rootcart/catalog";
import { site } from "@/lib/site";

const staticRoutes = [
  "",
  "/collections",
  "/search",
  "/cart",
  "/checkout",
  "/tracking",
  "/about-us",
  "/contact-us",
  "/how-to-order",
  "/faq",
  "/privacy-policy",
  "/terms-and-condition",
  "/return-and-refund",
  "/cookie-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);

  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${site.url}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...categories.map((category) => ({
      url: `${site.url}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${site.url}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
