import { REVALIDATE, TAGS, readApi } from "@/lib/rootcart/api";
import { toCategory, toProduct } from "@/lib/rootcart/map";
import type {
  ApiCategory,
  ApiCollection,
  ApiConfig,
  ApiContentEntry,
  ApiProduct,
} from "@/lib/rootcart/types";
import type { Category, Product } from "@/lib/types";

/**
 * Server-side catalogue reads.
 *
 * <p>Every function here is async and returns something renderable on failure — an empty array, or
 * `null` for a single lookup. A storefront that throws because the API blipped is worse than one that
 * shows an empty shelf, and the pages already have empty states.</p>
 *
 * <p>Reads are memoised per request by Next's fetch cache and shared across the route, so two
 * components asking for the same page of products issue one HTTP call.</p>
 */

/** RootCart caps a page at 100. Catalogue-wide reads walk pages up to this many products. */
const MAX_PRODUCTS = 500;
const PAGE_SIZE = 100;

// ---------------------------------------------------------------- products

/**
 * The whole published catalogue.
 *
 * <p>Walked in pages because the API caps a page at 100. This is the honest cost of a template whose
 * home page derives its own "best sellers" and "new arrivals" lists client-side; a store past
 * {@link MAX_PRODUCTS} should drive those sections from collections instead, which is one call each.</p>
 */
export async function getAllProducts(): Promise<Product[]> {
  const collected: Product[] = [];
  let cursor: string | null = null;

  while (collected.length < MAX_PRODUCTS) {
    const query = new URLSearchParams({ limit: String(PAGE_SIZE), include: "metafields" });
    if (cursor) query.set("cursor", cursor);

    const page = await readApi<ApiProduct[]>(`/products?${query.toString()}`, {
      revalidate: REVALIDATE.catalog,
      tags: [TAGS.catalog],
    });

    if (!page.data || page.data.length === 0) break;
    collected.push(...page.data.map(toProduct));

    if (!page.meta?.hasMore || !page.meta.nextCursor) break;
    cursor = page.meta.nextCursor;
  }

  return collected;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await readApi<ApiProduct>(
    `/products/${encodeURIComponent(slug)}?include=metafields`,
    { revalidate: REVALIDATE.catalog, tags: [TAGS.catalog] },
  );
  return result.data ? toProduct(result.data) : null;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    include: "metafields",
    category: categorySlug,
  });

  const result = await readApi<ApiProduct[]>(`/products?${query.toString()}`, {
    revalidate: REVALIDATE.catalog,
    tags: [TAGS.catalog],
  });
  return (result.data ?? []).map(toProduct);
}

export async function searchCatalog(query: string): Promise<Product[]> {
  const trimmed = query.trim();
  // Matches the old behaviour: an empty query returns nothing rather than the whole shop.
  if (trimmed === "") return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: String(PAGE_SIZE),
    include: "metafields",
  });

  const result = await readApi<ApiProduct[]>(`/products?${params.toString()}`, {
    revalidate: REVALIDATE.catalog,
    tags: [TAGS.catalog],
  });
  return (result.data ?? []).map(toProduct);
}

/**
 * Other products in the same category.
 *
 * <p>Excludes the product being viewed, which the API cannot do for us — so one extra row is
 * requested and the current product filtered out, rather than returning `limit - 1` items.</p>
 */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!product.category) return [];

  const siblings = await getProductsByCategory(product.category);
  return siblings.filter((candidate) => candidate.slug !== product.slug).slice(0, limit);
}

// ---------------------------------------------------------------- categories

export async function getCategories(): Promise<Category[]> {
  const result = await readApi<ApiCategory[]>("/categories?include=metafields", {
    revalidate: REVALIDATE.config,
    tags: [TAGS.config],
  });

  return (result.data ?? [])
    // Only top-level categories become navigation entries; a subcategory would otherwise appear
    // beside its own parent in the menu.
    .filter((category) => !category.parentId)
    .map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

// ---------------------------------------------------------------- collections

export type Collection = {
  slug: string;
  title: string;
  description: string;
  productCount: number;
};

export async function getCollections(): Promise<Collection[]> {
  const result = await readApi<ApiCollection[]>("/collections", {
    revalidate: REVALIDATE.config,
    tags: [TAGS.config],
  });

  return (result.data ?? []).map((collection) => ({
    slug: collection.slug,
    title: collection.title,
    description: collection.description ?? "",
    productCount: collection.productCount ?? 0,
  }));
}

/**
 * A named collection's products, in the order the seller chose.
 *
 * <p>Returns an empty array for a collection that does not exist, so a home-page section whose
 * collection the seller has not created yet simply does not render.</p>
 */
export async function getCollectionProducts(slug: string, limit = 8): Promise<Product[]> {
  const query = new URLSearchParams({ limit: String(limit), include: "metafields" });

  const result = await readApi<ApiProduct[]>(
    `/collections/${encodeURIComponent(slug)}/products?${query.toString()}`,
    { revalidate: REVALIDATE.catalog, tags: [TAGS.catalog] },
  );
  return (result.data ?? []).map(toProduct);
}

/**
 * The collection handles this template looks for on the home page.
 *
 * <p>A seller creates these in Content → Collections. None is required: each section falls back to a
 * slice of the catalogue so a brand-new store still has a full-looking home page.</p>
 */
export const HOME_COLLECTIONS = {
  featured: "featured",
  bestSellers: "best-sellers",
  newArrivals: "new-arrivals",
  deals: "deals",
} as const;

// ---------------------------------------------------------------- store config

export async function getStoreConfig(): Promise<ApiConfig | null> {
  const result = await readApi<ApiConfig>("/config", {
    revalidate: REVALIDATE.config,
    tags: [TAGS.config],
  });
  return result.data;
}

// ---------------------------------------------------------------- content

export async function getContentEntries(type: string, limit = 50): Promise<ApiContentEntry[]> {
  const result = await readApi<ApiContentEntry[]>(
    `/content/${encodeURIComponent(type)}?limit=${limit}`,
    { revalidate: REVALIDATE.content, tags: [TAGS.content] },
  );
  return result.data ?? [];
}
