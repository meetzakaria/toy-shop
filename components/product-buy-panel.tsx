"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CartIcon, Check } from "@/components/icons";
import { ProductMedia, swatchColor } from "@/components/product-art";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

/**
 * The product image, plus one thumbnail per option.
 *
 * <p>It used to fake a photo gallery from four invented view names — "front", "angle", "detail",
 * "pack" — each drawn in a rotated colour. There was nothing behind them: RootCart stores a single
 * image per product, so a four-shot gallery was showing the same thing four times. The thumbnails now
 * mean something, switching the tint to the option they name.</p>
 */
export function ProductGallery({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors[0]);

  return (
    <div>
      <ProductMedia
        slug={product.slug}
        category={product.category}
        name={product.name}
        image={product.image}
        color={product.image ? undefined : color}
        className="aspect-square w-full rounded-2xl border border-line bg-surface"
      />
      {product.colors.length > 1 && !product.image && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {product.colors.slice(0, 4).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              aria-label={`Show ${option}`}
              aria-pressed={color === option}
              className={`overflow-hidden rounded-xl border transition ${
                color === option ? "border-primary" : "border-line hover:border-primary"
              }`}
            >
              <ProductMedia
                slug={`${product.slug}-${option}`}
                category={product.category}
                name={product.name}
                color={option}
                className="aspect-square w-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuyPanel({ product }: { product: Product }) {
  const { add, busy, error } = useCart();
  const router = useRouter();
  // Tracks the variant itself, not just its label — the label is what the buyer reads, the id is what
  // the server needs to add the right one.
  const [variant, setVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const color = variant?.name ?? product.colors[0];
  const unitPrice = variant?.price ?? product.price;
  // A variant can be out of stock while the product still has others available.
  const available = variant ? variant.inStock : product.inStock;

  const handleAdd = async () => {
    await add(product, { variantId: variant?.id, quantity });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const buyNow = async () => {
    // The drawer is suppressed here: it used to slide open over the checkout page being navigated to.
    await add(product, { variantId: variant?.id, quantity, openDrawer: false });
    router.push("/checkout");
  };

  return (
    <div className="space-y-5">
      {product.variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold">
            Option: <span className="font-normal text-muted">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setVariant(option)}
                aria-pressed={variant?.id === option.id}
                disabled={!option.inStock}
                title={option.inStock ? undefined : "Out of stock"}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition disabled:opacity-40 ${
                  variant?.id === option.id
                    ? "border-primary bg-primary-soft text-primary-dark"
                    : "border-line hover:border-primary/60"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border border-line"
                  style={{ backgroundColor: swatchColor(option.name) }}
                  aria-hidden="true"
                />
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-lg border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="px-4 py-2.5 text-lg leading-none"
          >
            −
          </button>
          <span className="min-w-10 text-center font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            aria-label="Increase quantity"
            className="px-4 py-2.5 text-lg leading-none"
          >
            +
          </button>
        </div>
        <p className="text-sm text-muted">
          Total:{" "}
          <span className="font-bold text-ink">
            {formatPrice(unitPrice * quantity)}
          </span>
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      {!available && (
        <p className="rounded-lg bg-surface px-3 py-2 text-sm font-medium text-muted">
          This option is out of stock right now.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!available || busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary py-3 text-sm font-bold text-primary transition hover:bg-primary-soft disabled:opacity-40"
        >
          {added ? (
            <>
              <Check className="h-4.5 w-4.5" aria-hidden="true" />
              Added to cart
            </>
          ) : (
            <>
              <CartIcon className="h-4.5 w-4.5" aria-hidden="true" />
              Add to Cart
            </>
          )}
        </button>
        <button
          type="button"
          onClick={buyNow}
          disabled={!available || busy}
          className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-40"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
