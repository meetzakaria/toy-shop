"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CartIcon, Close, Trash } from "@/components/icons";
import { ProductMedia } from "@/components/product-art";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const {
    lines,
    subtotal,
    count,
    drawerOpen,
    closeDrawer,
    remove,
    setQuantity,
    busy,
    error,
  } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/50"
        onClick={closeDrawer}
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <CartIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            Your Cart ({count})
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line"
          >
            <Close className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CartIcon className="h-12 w-12 text-line" aria-hidden="true" />
            <p className="text-sm text-muted">Your cart is empty right now.</p>
            <Link
              href="/collections"
              onClick={closeDrawer}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p className="border-b border-line bg-danger/10 px-5 py-2.5 text-xs text-danger">
                {error}
              </p>
            )}
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.itemId} className="flex gap-3 py-4">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeDrawer}
                    className="shrink-0"
                  >
                    <ProductMedia
                      slug={line.slug}
                      category={line.category}
                      name={line.name}
                      image={line.image}
                      color={line.color}
                      className="h-20 w-20 rounded-lg border border-line"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={closeDrawer}
                      className="line-clamp-2-fallback text-sm font-medium hover:text-primary"
                    >
                      {line.name}
                    </Link>
                    {line.color && (
                      <p className="mt-0.5 text-xs text-muted">{line.color}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-line">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(line.itemId, line.quantity - 1)}
                          disabled={busy}
                          className="px-2.5 py-1 text-sm disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setQuantity(line.itemId, line.quantity + 1)}
                          disabled={
                            busy ||
                            (line.stockQuantity != null && line.quantity >= line.stockQuantity)
                          }
                          className="px-2.5 py-1 text-sm disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {formatPrice(line.lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(line.itemId)}
                        disabled={busy}
                        aria-label={`Remove ${line.name}`}
                        className="ml-auto text-muted transition hover:text-danger"
                      >
                        <Trash className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Delivery charge is calculated at checkout.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="rounded-full border border-line py-2.5 text-center text-sm font-semibold transition hover:border-primary hover:text-primary"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
