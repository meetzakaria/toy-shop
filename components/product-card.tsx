"use client";

import Link from "next/link";
import { CartIcon } from "@/components/icons";
import { ProductMedia } from "@/components/product-art";
import { Rating } from "@/components/rating";
import { discountPercent } from "@/lib/data/products";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { add, busy } = useCart();
  const discount = discountPercent(product);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition hover:border-primary/50 hover:shadow-lg">
      <Link
        href={`/products/${product.slug}`}
        className="relative block bg-surface"
        aria-label={product.name}
      >
        <ProductMedia
          slug={product.slug}
          category={product.category}
          name={product.name}
          image={product.image}
          color={product.colors[0]}
          className="aspect-square w-full transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-md bg-danger px-2 py-0.5 text-[11px] font-bold text-white">
              -{discount}%
            </span>
          )}
          {product.badge && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
              {product.badge}
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-md bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {product.brand}
        </p>
        <h3 className="text-sm font-medium leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2-fallback transition hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>
        <Rating value={product.rating} reviews={product.reviews} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="text-base font-bold text-primary">
              {formatPrice(product.price)}
            </p>
            {product.oldPrice && (
              <p className="text-xs text-muted line-through">
                {formatPrice(product.oldPrice)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => add(product)}
            disabled={!product.inStock || busy}
            aria-label={
              product.inStock ? `Add ${product.name} to cart` : `${product.name} is out of stock`
            }
            className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary-dark transition hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-primary-soft disabled:hover:text-primary-dark"
          >
            <CartIcon className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  columns = 4,
}: {
  products: Product[];
  columns?: 3 | 4 | 5;
}) {
  const gridCols =
    columns === 5
      ? "sm:grid-cols-3 lg:grid-cols-5"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${gridCols}`}>
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
