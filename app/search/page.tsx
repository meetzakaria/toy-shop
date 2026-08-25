import type { Metadata } from "next";
import Link from "next/link";
import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeader } from "@/components/section";
import { SearchBox } from "@/components/search-box";
import { getCategories, searchCatalog } from "@/lib/rootcart/catalog";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the full catalogue by product name, brand or category.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  // Searched by the API rather than by scanning a bundled array, so it covers the live catalogue.
  const [results, categories] = await Promise.all([searchCatalog(query), getCategories()]);

  return (
    <>
      <PageHeader
        title={query ? `Search results for “${query}”` : "Search"}
        description={
          query
            ? `${results.length} product${results.length === 1 ? "" : "s"} matched your search.`
            : "Type a product, brand or category to find what you need."
        }
        breadcrumb={[{ label: "Search" }]}
      />

      <div className="container-page pt-8">
        <div className="mx-auto max-w-2xl">
          <SearchBox defaultValue={query} />
        </div>
      </div>

      {query && results.length === 0 ? (
        <div className="container-page py-16 text-center">
          <p className="text-lg font-semibold">Nothing matched “{query}”.</p>
          <p className="mt-2 text-sm text-muted">
            Try a shorter word, or browse a collection instead.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-primary hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : query ? (
        <CatalogBrowser products={results} />
      ) : (
        <div className="container-page py-16 text-center text-sm text-muted">
          Start typing above to search {categories.length} collections.
        </div>
      )}
    </>
  );
}
