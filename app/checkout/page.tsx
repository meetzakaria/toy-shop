"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "@/components/icons";
import { ProductMedia } from "@/components/product-art";
import { PageHeader } from "@/components/section";
import { submitCheckout, useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import type { ApiOrder } from "@/lib/rootcart/types";
import { useBrand } from "@/lib/store-context";

/** Friendly labels for the payment methods a store can enable in RootCart. */
const PAYMENT_LABELS: Record<string, { label: string; hint: string }> = {
  cod: { label: "Cash on delivery", hint: "Pay the rider when the parcel arrives" },
  bkash: { label: "bKash", hint: "Pay with bKash" },
  nagad: { label: "Nagad", hint: "Pay with Nagad" },
  rocket: { label: "Rocket", hint: "Pay with Rocket" },
  card: { label: "Card", hint: "Visa or Mastercard" },
  bank: { label: "Bank transfer", hint: "Transfer to the shop account" },
};

export default function CheckoutPage() {
  const { lines, totals, subtotal, ready, busy, error, previewShipping } = useCart();
  const brand = useBrand();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [order, setOrder] = useState<ApiOrder | null>(null);

  /**
   * One key per attempt, held across retries of that attempt.
   *
   * <p>This is what stops a submit that times out on a bad connection from becoming two orders: the
   * retry carries the same key and RootCart returns the original order instead of creating another.
   * It is regenerated only after a success, so the next order is genuinely new.</p>
   */
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const methods = useMemo(() => {
    const enabled = brand?.paymentMethods?.length ? brand.paymentMethods : ["cod"];
    return enabled.map((id) => ({
      id,
      ...(PAYMENT_LABELS[id] ?? { label: id.toUpperCase(), hint: "" }),
    }));
  }, [brand]);

  /**
   * The selection, corrected against what the store actually accepts.
   *
   * <p>Derived rather than corrected in an effect: the default is "cod" and a store may not enable
   * it, so an effect would render one frame with an invalid choice and then set state to fix it.</p>
   */
  const activePayment = methods.some((method) => method.id === payment)
    ? payment
    : (methods[0]?.id ?? "cod");

  /**
   * Re-prices delivery whenever the address changes.
   *
   * <p>The quote comes from the server rather than a local table, because the server is what the
   * order will actually be created with. The old page computed its own fee from two constants and
   * disagreed with both the cart page and the eventual order.</p>
   */
  useEffect(() => {
    if (!city.trim() && !district.trim()) return;
    const timer = window.setTimeout(() => {
      void previewShipping(city.trim(), district.trim());
    }, 500);
    return () => window.clearTimeout(timer);
  }, [city, district, previewShipping]);

  if (order) {
    return (
      <>
        <PageHeader title="Order Confirmed" breadcrumb={[{ label: "Checkout" }]} />
        <div className="container-page py-14">
          <div className="mx-auto max-w-lg rounded-2xl border border-line p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
              <Check className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-extrabold">Thank you for your order</h2>
            <p className="mt-2 text-sm text-muted">
              Your order reference is{" "}
              <span className="font-bold text-ink">{order.orderNumber}</span>. Our team will
              call you on the number you provided to confirm the delivery slot.
            </p>
            {order.totals?.totalAmount != null && (
              <p className="mt-2 text-sm text-muted">
                Total: <span className="font-semibold text-ink">{formatPrice(order.totals.totalAmount)}</span>
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/tracking?order=${order.orderNumber ?? ""}`}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                Track this order
              </Link>
              <Link
                href="/collections"
                className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold"
              >
                Keep shopping
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!ready) {
    return (
      <>
        <PageHeader title="Checkout" breadcrumb={[{ label: "Checkout" }]} />
        <p className="container-page py-16 text-center text-sm text-muted">
          Loading your cart…
        </p>
      </>
    );
  }

  if (lines.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" breadcrumb={[{ label: "Checkout" }]} />
        <div className="container-page py-16 text-center">
          <p className="text-lg font-semibold">There is nothing to check out yet.</p>
          <Link
            href="/collections"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Browse products
          </Link>
        </div>
      </>
    );
  }

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFailure(null);

    try {
      const placed = await submitCheckout(
        {
          customerName: name.trim(),
          customerEmail: email.trim(),
          phone: phone.trim(),
          // RootCart stores one address string, so the buyer's note rides along with it rather than
          // being collected and quietly dropped.
          address: note.trim() ? `${address.trim()}\n\nNote: ${note.trim()}` : address.trim(),
          city: city.trim(),
          district: district.trim(),
          paymentMethod: activePayment,
        },
        idempotencyKey.current,
      );

      idempotencyKey.current = crypto.randomUUID();
      setOrder(placed);
      window.scrollTo({ top: 0 });
    } catch (caught) {
      // The cart is deliberately NOT cleared here. It used to be emptied before anything was saved,
      // so a failed order left the buyer with neither an order nor a basket.
      setFailure(
        caught instanceof Error
          ? caught.message
          : "We could not place the order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-primary";

  return (
    <>
      <PageHeader
        title="Checkout"
        description="Fill in the delivery details. We call every customer before dispatch."
        breadcrumb={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />

      <form onSubmit={placeOrder} className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <fieldset className="rounded-xl border border-line p-5">
            <legend className="px-1 text-sm font-bold">Delivery details</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Full name</span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Mobile number</span>
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9+\- ]{9,}"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  className={field}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">Email</span>
                <input
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={field}
                />
                <span className="mt-1 block text-xs text-muted">
                  Your order confirmation goes here.
                </span>
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">City</span>
                <input
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  autoComplete="address-level2"
                  placeholder="Dhaka"
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">District</span>
                <input
                  required
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  autoComplete="address-level1"
                  placeholder="Dhaka"
                  className={field}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">Full address</span>
                <textarea
                  required
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={3}
                  autoComplete="street-address"
                  placeholder="House, road, area"
                  className={field}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">
                  Order note <span className="text-muted">(optional)</span>
                </span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className={field}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-line p-5">
            <legend className="px-1 text-sm font-bold">Payment method</legend>
            <div className="mt-3 space-y-3">
              {methods.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 text-sm transition ${
                    activePayment === option.id ? "border-primary bg-primary-soft" : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={option.id}
                    checked={activePayment === option.id}
                    onChange={() => setPayment(option.id)}
                    className="mt-0.5 accent-[var(--primary-color)]"
                  />
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    {option.hint && (
                      <span className="block text-xs text-muted">{option.hint}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="h-max rounded-xl border border-line p-5">
          <h2 className="text-base font-bold">Your order</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((line) => (
              <li key={line.itemId} className="flex gap-3 text-sm">
                <ProductMedia
                  slug={line.slug}
                  category={line.category}
                  name={line.name}
                  image={line.image}
                  color={line.color}
                  className="h-14 w-14 shrink-0 rounded-lg border border-line"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2-fallback font-medium">{line.name}</p>
                  <p className="text-xs text-muted">
                    {line.color ? `${line.color} × ${line.quantity}` : `× ${line.quantity}`}
                  </p>
                </div>
                <span className="font-semibold">{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">
                Delivery{totals?.shippingLabel ? ` (${totals.shippingLabel})` : ""}
              </dt>
              <dd>
                {!city.trim() && !district.trim() ? (
                  <span className="text-xs text-muted">Enter your city</span>
                ) : totals?.shippingAmount ? (
                  formatPrice(totals.shippingAmount)
                ) : (
                  "Free"
                )}
              </dd>
            </div>
            {totals && totals.taxAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd>{formatPrice(totals.taxAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-primary">
                {formatPrice(totals?.totalAmount ?? subtotal)}
              </dd>
            </div>
          </dl>

          {(failure ?? error) && (
            <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
              {failure ?? error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || busy}
            className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? "Placing your order…" : "Place Order"}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            By placing this order you agree to our{" "}
            <Link href="/terms-and-condition" className="text-primary hover:underline">
              terms
            </Link>
            .
          </p>
        </aside>
      </form>
    </>
  );
}
