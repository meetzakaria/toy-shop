import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "@/components/icons";
import { CategoryGrid } from "@/components/category-grid";
import { PageHeader, SectionHeading } from "@/components/section";
import { aboutStats } from "@/lib/data/content";
import { getSite } from "@/lib/rootcart/site";

export async function generateMetadata(): Promise<Metadata> {
  const storeSite = await getSite();
  return {
    title: "About Us",
    description: `Who runs ${storeSite.name}, what we stock and how we handle service.`,
  };
}

const promises = [
  "We only list what is physically in the warehouse — no ghost stock, no silent cancellations.",
  "Every price on the site is the price you pay; delivery is shown before you confirm.",
  "Each unit is powered on and checked at our desk before it is packed.",
  "One phone number reaches a human who can actually see your order.",
];

export default async function AboutPage() {
  const storeSite = await getSite();

  return (
    <>
      <PageHeader
        title={`About ${storeSite.name}`}
        description={storeSite.tagline}
        breadcrumb={[{ label: "About Us" }]}
      />

      <section className="container-page grid gap-10 py-10 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">Why we started</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            Buying a charger or a pair of earbuds should not be a gamble. Too many
            listings hide the real specification, quote a price that changes on the
            phone, then disappear when the product fails in week two. We built{" "}
            {storeSite.name} to be the boring opposite of that: a fixed price, an honest
            spec table and a service desk that answers.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            We stock eight collections — audio, accessories, charging, office gear,
            wearables, home electronics, car gear and fans — chosen because they are
            what people actually replace every year. Nothing on the site is listed
            until we have used it ourselves for at least a week.
          </p>
          <ul className="mt-6 space-y-2.5">
            {promises.map((promise) => (
              <li key={promise} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {promise}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid h-max grid-cols-2 gap-4">
          {aboutStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-line bg-surface p-6 text-center"
            >
              <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-1 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
          <div className="col-span-2 rounded-xl border border-line p-6">
            <h3 className="text-sm font-bold">Where to find us</h3>
            <p className="mt-2 text-sm text-ink">{storeSite.address}</p>
            <p className="mt-2 text-sm text-muted">{storeSite.hours}</p>
            <a
              href={storeSite.hotlineHref}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              {storeSite.hotline}
            </a>
          </div>
        </div>
      </section>

      <section className="container-page border-t border-line py-10">
        <SectionHeading
          title="What we stock"
          subtitle="Eight collections, restocked weekly."
          href="/collections"
        />
        <CategoryGrid compact />
      </section>

      <section className="container-page py-6 pb-12">
        <div className="rounded-2xl bg-primary px-6 py-10 text-center text-white sm:px-12">
          <h2 className="text-xl font-extrabold sm:text-2xl">
            Questions before you buy?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/85">
            Tell us your device and budget and we will point you at the right
            product — even if it is the cheaper one.
          </p>
          <Link
            href="/contact-us"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-white/90"
          >
            Talk to us
          </Link>
        </div>
      </section>
    </>
  );
}
