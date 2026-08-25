import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeader } from "@/components/section";
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/lib/rootcart/catalog";

/**
 * Prerenders the categories that exist when the site is built.
 *
 * <p>A category the seller adds afterwards still works: Next renders it on first request and caches
 * it, because `dynamicParams` defaults to true. Without that the new category would 404 until the
 * next deploy.</p>
 */
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.blurb,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const items = await getProductsByCategory(category.slug);

  return (
    <>
      <PageHeader
        title={category.name}
        description={category.blurb}
        breadcrumb={[
          { label: "Collections", href: "/collections" },
          { label: category.name },
        ]}
      />
      <CatalogBrowser products={items} columns={3} />
    </>
  );
}
