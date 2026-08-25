import {
  HOME_COLLECTIONS,
  getAllProducts,
  getCategories,
  getCollectionProducts,
} from "@/lib/rootcart/catalog";
import { discountPercent } from "@/lib/data/products";
import type { Category, Product } from "@/lib/types";

/**
 * Everything the home page shows, assembled in one place.
 *
 * <p>Each shelf prefers a collection the seller curates, and falls back to a slice of the catalogue
 * when they have not made one. That matters because the sections used to be inferred from data that
 * a real store has no reason to carry — "new arrivals" was `badge === "New"`, so a seller who typed
 * "Just in" silently emptied a whole section of their home page. Now the seller either curates the
 * shelf deliberately or gets a sensible default, and neither outcome is a blank page.</p>
 */

export type HomeSection = {
  products: Product[];
  /** True when the seller curated this shelf, false when it is a fallback slice. */
  curated: boolean;
};

export type HomeData = {
  featured: Product[];
  deals: HomeSection;
  bestSellers: HomeSection;
  newArrivals: HomeSection;
  categories: Category[];
  /** The first few categories, each with a handful of products, for the per-category shelves. */
  categoryShelves: { category: Category; products: Product[] }[];
};

async function shelf(slug: string, fallback: () => Product[]): Promise<HomeSection> {
  const curated = await getCollectionProducts(slug, 8);
  if (curated.length > 0) return { products: curated, curated: true };
  return { products: fallback(), curated: false };
}

export async function getHomeData(): Promise<HomeData> {
  // One catalogue read backs every fallback, rather than one per shelf.
  const [catalogue, categories] = await Promise.all([getAllProducts(), getCategories()]);

  const [featuredSection, deals, bestSellers, newArrivals] = await Promise.all([
    shelf(HOME_COLLECTIONS.featured, () => catalogue.slice(0, 4)),
    shelf(HOME_COLLECTIONS.deals, () =>
      catalogue
        .filter((product) => product.oldPrice)
        .sort((a, b) => discountPercent(b) - discountPercent(a))
        .slice(0, 8),
    ),
    shelf(HOME_COLLECTIONS.bestSellers, () =>
      [...catalogue].sort((a, b) => b.reviews - a.reviews).slice(0, 8),
    ),
    // Newest first, by the order the API returns them — it sorts by id descending.
    shelf(HOME_COLLECTIONS.newArrivals, () => catalogue.slice(0, 8)),
  ]);

  const shelves = categories.slice(0, 3).map((category) => ({
    category,
    products: catalogue
      .filter((product) => product.category === category.slug)
      .slice(0, 4),
  }));

  return {
    featured: featuredSection.products.slice(0, 4),
    deals,
    bestSellers,
    newArrivals,
    categories,
    // A category with nothing in it would render a heading over an empty grid.
    categoryShelves: shelves.filter((entry) => entry.products.length > 0),
  };
}
