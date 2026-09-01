import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { CategoryGrid } from "@/components/category-grid";
import { HeroSlider, type Slide } from "@/components/hero-slider";
import { ProductGrid } from "@/components/product-card";
import { SectionHeading } from "@/components/section";
import { ShowcaseArc } from "@/components/showcase-arc";
import { TrustBar } from "@/components/trust-bar";
import { discountPercent } from "@/lib/data/products";
import { getHomeData } from "@/lib/rootcart/home";

/** Rotating copy for the hero. Positional, so it is unrelated to the product it lands on. */
const HERO_EYEBROWS = ["Deal of the week", "New season pick", "Editor's choice", "Staff favourite"];

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

export default async function HomePage() {
  const home = await getHomeData();

  // Built here rather than at module scope, which could not await. The tint follows the product's own
  // category so a rebranded store no longer shows four hardcoded colours nobody chose.
  const slides: Slide[] = home.featured.map((product, index) => ({
    eyebrow: HERO_EYEBROWS[index % HERO_EYEBROWS.length],
    title: product.name,
    copy: product.highlights[0] ?? product.description.slice(0, 120),
    price: product.price,
    discount: discountPercent(product) || undefined,
    href: `/products/${product.slug}`,
    slug: product.slug,
    category: product.category,
    image: product.image,
    tint:
      home.categories.find((category) => category.slug === product.category)?.hue ?? "#659900",
  }));

  // The two promo tiles used to link at two hardcoded category handles. A store without those
  // categories got two links to a 404, so they follow whatever the store actually has.
  const [promoOne, promoTwo] = home.categories;

  return (
    <>
      <HeroSlider slides={slides} />

      <section className="container-page pt-10">
        <SectionHeading
          title="Shop by category"
          subtitle="Everything we stock, grouped so you can find it fast."
          href="/collections"
        />
        <CategoryGrid compact />
      </section>

      <TrustBar />

      {home.deals.products.length > 0 && (
        <section className="container-page py-6">
          <SectionHeading
            title="Deals running now"
            subtitle="Discounts refreshed every week while stock lasts."
            href="/collections"
            linkLabel="See all deals"
          />
          <ProductGrid products={home.deals.products} />
        </section>
      )}

      {(promoOne || promoTwo) && (
        <section className="container-page py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {promoOne && (
              <Link
                href={`/category/${promoOne.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-primary-soft to-white p-7"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Popular pick
                </p>
                <p className="mt-2 max-w-xs text-xl font-extrabold leading-snug">
                  {promoOne.blurb || `Everything in ${promoOne.name}, in one place`}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Shop {promoOne.name.toLowerCase()}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            )}
            {promoTwo && (
              <Link
                href={`/category/${promoTwo.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-white p-7"
                style={{ backgroundImage: `linear-gradient(to bottom right, ${promoTwo.hue}1a, #ffffff)` }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em]"
                  style={{ color: promoTwo.hue }}
                >
                  Worth a look
                </p>
                <p className="mt-2 max-w-xs text-xl font-extrabold leading-snug">
                  {promoTwo.blurb || `Fresh stock in ${promoTwo.name}`}
                </p>
                <span
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: promoTwo.hue }}
                >
                  Shop {promoTwo.name.toLowerCase()}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Pinned: the shelf turns while the page holds still. Fed from best
          sellers, and it renders nothing under three products. */}
      <ShowcaseArc
        products={home.bestSellers.products}
        eyebrow="Most wanted"
        title="The shelf, turning"
      />

      {home.bestSellers.products.length > 0 && (
        <section className="container-page py-6">
          <SectionHeading
            title="Best sellers"
            subtitle="What customers keep coming back for."
            href="/collections"
          />
          <ProductGrid products={home.bestSellers.products} />
        </section>
      )}

      {home.newArrivals.curated && home.newArrivals.products.length > 0 && (
        <section className="container-page py-6">
          <SectionHeading
            title="New arrivals"
            subtitle="Just landed in the warehouse this month."
          />
          <ProductGrid products={home.newArrivals.products} />
        </section>
      )}

      {home.categoryShelves.map(({ category, products }) => (
        <section key={category.slug} className="container-page py-6">
          <SectionHeading
            title={category.name}
            subtitle={category.blurb}
            href={`/category/${category.slug}`}
          />
          <ProductGrid products={products} />
        </section>
      ))}

      <section className="container-page py-10">
        <div className="rounded-2xl bg-primary px-6 py-10 text-center text-white sm:px-12">
          <h2 className="text-xl font-extrabold sm:text-2xl">
            Not sure which one fits your setup?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/85">
            Message us with your phone or laptop model and we will tell you exactly
            which charger, case or dock works — before you pay for anything.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact-us"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-white/90"
            >
              Ask a question
            </Link>
            <Link
              href="/how-to-order"
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              How ordering works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
