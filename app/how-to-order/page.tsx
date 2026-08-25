import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Truck } from "@/components/icons";
import { PageHeader } from "@/components/section";
import { orderSteps } from "@/lib/data/content";
import { formatPrice } from "@/lib/format";
import { getSite } from "@/lib/rootcart/site";

export const metadata: Metadata = {
  title: "How to Order",
  description:
    "Step by step: how to place an order, pay, and receive your parcel.",
};

export default async function HowToOrderPage() {
  const storeSite = await getSite();

  return (
    <>
      <PageHeader
        title="How to Order"
        description="Six steps from finding a product to opening the box."
        breadcrumb={[{ label: "How to Order" }]}
      />

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
        <ol className="space-y-4">
          {orderSteps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-xl border border-line p-5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h2 className="text-sm font-bold">{step.title}</h2>
                <p className="mt-1 text-sm text-ink">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="h-max space-y-5">
          <div className="rounded-xl border border-line p-5 text-sm">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Truck className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
              Delivery charges
            </h2>
            <dl className="mt-3 space-y-2">
              {/* The store's own zones, so this table cannot drift from what checkout charges. */}
              {storeSite.shippingZones.map((zone) => (
                <div key={zone.name} className="flex justify-between">
                  <dt className="text-muted">{zone.name}</dt>
                  <dd className="font-semibold">{formatPrice(zone.rate)}</dd>
                </div>
              ))}
              <div className="border-t border-line pt-2 text-xs text-muted">
                The exact charge for your address is shown at checkout before you confirm.
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 text-sm">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Phone className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
              Prefer to order by phone?
            </h2>
            <p className="mt-2 text-ink">
              Call the hotline with the product name and your address. We place the
              order for you and send the reference by SMS.
            </p>
            <a
              href={storeSite.hotlineHref}
              className="mt-3 block rounded-full bg-primary py-2.5 text-center font-semibold text-white transition hover:bg-primary-dark"
            >
              {storeSite.hotline}
            </a>
          </div>

          <div className="rounded-xl border border-line p-5 text-sm">
            <p className="font-semibold">Already ordered?</p>
            <Link
              href="/tracking"
              className="mt-2 inline-block font-semibold text-primary hover:underline"
            >
              Track your parcel →
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
