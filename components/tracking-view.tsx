"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Box, Check, Headset, Truck } from "@/components/icons";
import { readRememberedOrder } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import type { ApiOrder } from "@/lib/rootcart/types";
import { useBrand } from "@/lib/store-context";

/**
 * Order tracking, limited to what this storefront can honestly know.
 *
 * <p>The page used to derive a four-step timeline from `reference.length % 4`, so every reference
 * "tracked" successfully and every ten-character one showed the same three-of-four progress. That is
 * worse than no tracking: it tells a waiting customer something confidently false.</p>
 *
 * <p>RootCart has no public order-lookup endpoint, and the scope that would read one is not
 * browser-safe by design, so a publishable key cannot fetch an arbitrary order. What it can do is
 * show the buyer the order they placed on this device, with the real status the server returned — and
 * say plainly, for anything else, that the shop has to look it up.</p>
 */
export function TrackingView({ initialReference }: { initialReference: string }) {
  const brand = useBrand();
  const [reference, setReference] = useState(initialReference);
  /**
   * The saved order, read through a store snapshot rather than an effect.
   *
   * <p>localStorage is not available while the server renders, so the server snapshot is null and the
   * client fills it in on hydration. Doing this in an effect would set state during the first commit
   * for a value that never changes.</p>
   */
  const remembered = useSyncExternalStore(
    () => () => {},
    () => readRememberedOrder(),
    () => null,
  );

  // A reference in the URL — the checkout confirmation links here with one — resolves without the
  // buyer retyping it, which is what that link always implied and never did.
  const [manualLookup, setManualLookup] = useState<
    { reference: string; order: ApiOrder | null } | null
  >(null);

  const lookup =
    manualLookup ??
    (initialReference
      ? {
          reference: initialReference,
          order: remembered?.orderNumber === initialReference ? remembered : null,
        }
      : null);

  const search = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setManualLookup({
      reference: trimmed,
      order: remembered?.orderNumber === trimmed ? remembered : null,
    });
  };

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
      <div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            search(reference);
          }}
          className="flex flex-col gap-3 rounded-xl border border-line p-5 sm:flex-row"
        >
          <label className="flex-1 text-sm">
            <span className="mb-1.5 block font-medium">Order reference</span>
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="RC-…"
              className="w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            className="self-end rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
          >
            Track Order
          </button>
        </form>

        {remembered?.orderNumber && !lookup && (
          <button
            type="button"
            onClick={() => {
              setReference(remembered.orderNumber ?? "");
              search(remembered.orderNumber ?? "");
            }}
            className="mt-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm transition hover:border-primary"
          >
            <span className="font-semibold">Your last order: {remembered.orderNumber}</span>
            <span className="mt-0.5 block text-xs text-muted">Tap to see its details</span>
          </button>
        )}

        {lookup?.order && (
          <div className="mt-6 rounded-xl border border-line p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">Order {lookup.order.orderNumber}</h2>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold capitalize text-primary-dark">
                {lookup.order.orderStatus ?? "received"}
              </span>
            </div>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between sm:block">
                <dt className="text-muted">Payment</dt>
                <dd className="font-medium capitalize">
                  {lookup.order.paymentMethod ?? "—"}
                  {lookup.order.paymentStatus ? ` · ${lookup.order.paymentStatus}` : ""}
                </dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-muted">Delivering to</dt>
                <dd className="font-medium">
                  {[lookup.order.shipping?.city, lookup.order.shipping?.district]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
            </dl>

            {lookup.order.items && lookup.order.items.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                {lookup.order.items.map((item, index) => (
                  <li key={index} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      {item.productName}
                      {item.variantName ? ` · ${item.variantName}` : ""}
                      <span className="text-muted"> × {item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatPrice(item.lineTotal ?? 0)}</span>
                  </li>
                ))}
              </ul>
            )}

            {lookup.order.totals?.totalAmount != null && (
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(lookup.order.totals.totalAmount)}
                </span>
              </div>
            )}

            <p className="mt-5 flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5 text-xs text-muted">
              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              For the delivery stage — packed, dispatched, out for delivery — call the shop.
              We do not publish live courier status here yet.
            </p>
          </div>
        )}

        {lookup && !lookup.order && (
          <div className="mt-6 rounded-xl border border-line p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted">
                <Box className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  We cannot look up {lookup.reference} from here
                </p>
                <p className="mt-1 text-sm text-muted">
                  This page can only show an order placed on this device. For any other order,
                  call the shop with your reference and they will check it for you.
                </p>
                {brand?.contactPhone && (
                  <a
                    href={`tel:${brand.contactPhone.replace(/[^\d+]/g, "")}`}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    <Headset className="h-4 w-4" aria-hidden="true" />
                    Call {brand.contactPhone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="h-max space-y-4 rounded-xl border border-line p-5 text-sm">
        <h2 className="text-base font-bold">Need the reference?</h2>
        <p className="text-muted">
          It is on the confirmation screen right after you place an order, and in the message
          we send you.
        </p>
        <div className="flex items-start gap-2.5">
          <Headset className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Call{" "}
            <a
              href={`tel:${(brand?.contactPhone ?? "").replace(/[^\d+]/g, "")}`}
              className="font-semibold hover:text-primary"
            >
              {brand?.contactPhone ?? "the shop"}
            </a>{" "}
            and we will look it up for you.
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
          <span>Every order is confirmed by phone before it is dispatched.</span>
        </div>
        <Link
          href="/contact-us"
          className="block rounded-full border border-line py-2.5 text-center font-semibold transition hover:border-primary hover:text-primary"
        >
          Contact support
        </Link>
      </aside>
    </div>
  );
}
