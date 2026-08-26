import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, categoryIcons } from "@/components/icons";
import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeader, SectionHeading } from "@/components/section";
import { getAllProducts, getCategories } from "@/lib/rootcart/catalog";

export const metadata: Metadata = {
  title: "Collections",
  // No longer enumerates the collections by name: that list belonged to one seeded catalogue and
  // went stale the moment a real store defined its own.
  description: "Browse every collection in the store.",
};

/**
 * Rendered per request rather than prerendered at build time.
 *
 * <p>This page is the store's whole catalogue at a glance, so it is the one page that is useless
 * without data — and build time is exactly when data is least likely to be available. Hosting
 * platforms withhold environment variables marked "secret" or "sensitive" from the build and expose
 * them only at runtime, which means the build can be the one moment the API is unreachable. A page
 * prerendered in that moment is a permanently empty shop: the HTML is already on the CDN, and
 * regenerating it is best-effort, so the store can stay blank long after the connection is fine.</p>
 *
 * <p>Rendering on demand removes that whole failure mode. It is not the cost it looks like: the
 * catalogue reads inside are still cached for a minute and tagged, so a
 * burst of visitors shares one round trip to RootCart and a webhook can still push new prices
 * instantly. What is given up is CDN-cached HTML; what is bought is a storefront that cannot be
 * frozen empty by a bad minute during a deploy.</p>
 */
export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);

  return (
    <>
      <PageHeader
        title="All Collections"
        description={`${categories.length} collection${categories.length === 1 ? "" : "s"}, one warehouse. Everything ships within a day of your order.`}
        breadcrumb={[{ label: "Collections" }]}
      />

      <section className="container-page pt-8">
        <SectionHeading
          title="Browse collections"
          subtitle={`${products.length} products in stock right now`}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            // Defaulted rather than indexed blind — an unknown icon name would render undefined.
            const Icon = categoryIcons[category.icon] ?? categoryIcons.cable;
            const count = category.productCount;
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group flex flex-col rounded-xl border border-line p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                style={{
                  background: `linear-gradient(150deg, ${category.hue}14, #ffffff 60%)`,
                }}
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-full bg-white"
                  style={{ color: category.hue }}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-base font-bold">{category.name}</h2>
                <p className="mt-1 flex-1 text-sm text-muted">{category.blurb}</p>
                <span className="mt-4 flex items-center justify-between text-sm font-semibold text-primary">
                  {count} items
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-8 border-t border-line">
        <div className="container-page pt-8">
          <SectionHeading
            title="Every product"
            subtitle="Filter by price, colour, brand and availability."
          />
        </div>
        <CatalogBrowser products={products} />
      </div>
    </>
  );
}
