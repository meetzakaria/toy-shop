"use client";

import Link from "next/link";
import { CartIcon, Trash } from "@/components/icons";
import { ProductMedia } from "@/components/product-art";
import { PageHeader } from "@/components/section";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { lines, totals, subtotal, ready, busy, error, remove, setQuantity, clear } =
    useCart();

  return (
    <>
      <PageHeader
        title="Shopping Cart"
        description="Review your items before checkout. Nothing is charged until you confirm the order."
        breadcrumb={[{ label: "Cart" }]}
      />

      <div className="container-page py-8">
        {!ready ? (
          <p className="py-16 text-center text-sm text-muted">Loading your cart…</p>
        ) : lines.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line py-20 text-center">
            <CartIcon className="h-12 w-12 text-line" aria-hidden="true" />
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="max-w-sm text-sm text-muted">
              Browse the collections and add something you actually need — we will
              keep it here while you decide.
            </p>
            <Link
              href="/collections"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="hidden bg-surface text-left text-xs uppercase tracking-wide text-muted sm:table-header-group">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {lines.map((line) => (
                    <tr key={`${line.slug}-${line.color}`} className="align-middle">
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <Link href={`/products/${line.slug}`} className="shrink-0">
                            <ProductMedia
                              slug={line.slug}
                              category={line.category}
                              name={line.name}
                              image={line.image}
                              color={line.color}
                              className="h-20 w-20 rounded-lg border border-line"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/products/${line.slug}`}
                              className="font-medium hover:text-primary"
                            >
                              {line.name}
                            </Link>
                            {line.color && (
                              <p className="mt-0.5 text-xs text-muted">{line.color}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => remove(line.itemId)}
                              disabled={busy}
                              className="mt-2 flex items-center gap-1.5 text-xs text-muted transition hover:text-danger"
                            >
                              <Trash className="h-3.5 w-3.5" aria-hidden="true" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted">{formatPrice(line.price)}</td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center rounded-lg border border-line">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQuantity(line.itemId, line.quantity - 1)}
                            disabled={busy}
                            className="px-3 py-1.5 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center">{line.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQuantity(line.itemId, line.quantity + 1)}
                            disabled={
                              busy ||
                              (line.stockQuantity != null && line.quantity >= line.stockQuantity)
                            }
                            className="px-3 py-1.5 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {formatPrice(line.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3">
                <Link
                  href="/collections"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  ← Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={clear}
                  disabled={busy}
                  className="text-sm text-muted transition hover:text-danger disabled:opacity-40"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <aside className="h-max rounded-xl border border-line p-5">
              <h2 className="text-base font-bold">Order Summary</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-medium">{formatPrice(subtotal)}</dd>
                </div>
                {totals && totals.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Tax</dt>
                    <dd className="font-medium">{formatPrice(totals.taxAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="text-xs text-muted">Calculated at checkout</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base">
                  <dt className="font-bold">Subtotal</dt>
                  <dd className="font-bold text-primary">{formatPrice(subtotal)}</dd>
                </div>
              </dl>
              {error && (
                <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                  {error}
                </p>
              )}
              <Link
                href="/checkout"
                className="mt-5 block rounded-full bg-primary py-3 text-center text-sm font-bold text-white transition hover:bg-primary-dark"
              >
                Proceed to Checkout
              </Link>
              <p className="mt-3 text-center text-xs text-muted">
                Cash on delivery available nationwide
              </p>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
