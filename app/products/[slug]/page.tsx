import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Headset, Refresh, Shield, Truck } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { BuyPanel, ProductGallery } from "@/components/product-buy-panel";
import { Rating } from "@/components/rating";
import { SectionHeading } from "@/components/section";
import { discountPercent } from "@/lib/data/products";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/rootcart/catalog";
import { getSite } from "@/lib/rootcart/site";
import { formatPrice } from "@/lib/format";

/**
 * Prerenders the catalogue as it stands at build time.
 *
 * <p>Products added later still resolve — `dynamicParams` defaults to true, so an unknown slug is
 * rendered on first request and cached rather than 404ing until the next deploy.</p>
 */
/**
 * Revalidated on a timer at the route level, not left to the fetches inside it.
 *
 * <p>Without this the page is only revalidated because a cached `fetch` asked for it — so a build that
 * ran while the API was unreachable produces a page with no fetches at all, which Next then treats as
 * fully static and never regenerates. The shop stays frozen and empty until someone redeploys, long
 * after the API came back. Declaring it here means the page always heals itself.</p>
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: product.name, description: product.description },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const discount = discountPercent(product);
  const [related, storeSite] = await Promise.all([
    getRelatedProducts(product),
    getSite(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.id,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: storeSite.currency,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="border-b border-line bg-surface">
        <nav aria-label="Breadcrumb" className="container-page py-4 text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/collections" className="hover:text-primary">
                Collections
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/category/${product.category}`}
                className="hover:text-primary"
              >
                {product.categoryName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink">{product.name}</li>
          </ol>
        </nav>
      </div>

      <div className="container-page grid gap-10 py-8 lg:grid-cols-2">
        <ProductGallery product={product} />

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {product.brand} · {product.categoryName}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Rating value={product.rating} reviews={product.reviews} size="md" />
            <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Check className="h-4 w-4" aria-hidden="true" />
              {product.inStock ? "In stock" : "Out of stock"}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-extrabold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <>
                <span className="text-lg text-muted line-through">
                  {formatPrice(product.oldPrice)}
                </span>
                <span className="rounded-md bg-danger px-2 py-1 text-xs font-bold text-white">
                  Save {formatPrice(product.oldPrice - product.price)} ({discount}%)
                </span>
              </>
            )}
          </div>

          <ul className="mt-6 space-y-2">
            {product.highlights.map((point) => (
              <li key={point} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-7 border-t border-line pt-7">
            <BuyPanel product={product} />
          </div>

          <dl className="mt-7 grid gap-3 rounded-xl border border-line bg-surface p-4 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Truck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="font-semibold">Delivery</dt>
                <dd className="text-muted">
                  {storeSite.shippingZones
                    .map((zone) => `${zone.name} ${formatPrice(zone.rate)}`)
                    .join(", ")}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Shield className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="font-semibold">Warranty</dt>
                <dd className="text-muted">{product.warranty}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Refresh className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="font-semibold">Returns</dt>
                <dd className="text-muted">7 days replacement on defects</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Headset className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="font-semibold">Need help?</dt>
                <dd className="text-muted">
                  <a href={storeSite.hotlineHref} className="hover:text-primary">
                    {storeSite.hotline}
                  </a>
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      <section className="container-page grid gap-8 border-t border-line py-10 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold">Product details</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            {product.description}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            Every unit is checked at our Dhaka desk before dispatch. If something
            arrives faulty, call the hotline within seven days and we replace it —
            no forms, no long queue.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold">Specifications</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {product.specs.map(([label, value]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <th scope="row" className="w-2/5 py-2.5 text-left font-medium text-muted">
                    {label}
                  </th>
                  <td className="py-2.5">{value}</td>
                </tr>
              ))}
              <tr className="border-b border-line last:border-0">
                <th scope="row" className="py-2.5 text-left font-medium text-muted">
                  Model code
                </th>
                <td className="py-2.5">{product.id}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-page border-t border-line py-10">
          <SectionHeading
            title="You may also like"
            subtitle={`More from ${product.categoryName}`}
            href={`/category/${product.category}`}
          />
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
