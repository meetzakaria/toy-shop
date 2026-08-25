import type { Product } from "@/lib/types";

/**
 * What is left of the old static catalogue.
 *
 * <p>The 65 hardcoded products and every list derived from them now come from RootCart — see
 * `lib/rootcart/catalog.ts`. This pure helper stayed because it is arithmetic over one product, not
 * data: it needs no store, no network and no await, and three components call it inside JSX.</p>
 */
export function discountPercent(product: Product) {
  if (!product.oldPrice) return 0;
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}
