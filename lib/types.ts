export type Category = {
  slug: string;
  name: string;
  blurb: string;
  icon: IconName;
  hue: string;
  /**
   * How many published products the category holds.
   *
   * <p>Carried on the category so grids and menus can show a count without asking the API per tile —
   * the counts used to be derived by filtering the whole catalogue inside a JSX map.</p>
   */
  productCount: number;
};

export type IconName =
  | "headphones"
  | "cable"
  | "bolt"
  | "keyboard"
  | "watch"
  | "tv"
  | "car"
  | "fan";

/**
 * One purchasable option of a product — a colour, a size, a pack.
 *
 * <p>`id` is what the cart is told to add. Without it a buyer could pick "Blue" and receive whichever
 * option happened to sort first, because a colour label on its own does not identify anything.</p>
 */
export type ProductVariant = {
  id: number;
  /** The label the seller typed. Shown on swatches and cart lines. */
  name: string;
  price: number;
  inStock: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  /** Category slug — the routing and filtering key. */
  category: string;
  /** Category display name, resolved server-side so no lookup is needed to show it. */
  categoryName: string;
  price: number;
  oldPrice?: number;
  /** Variant labels, for the swatch row. Empty when there is nothing to choose. */
  colors: string[];
  variants: ProductVariant[];
  rating: number;
  reviews: number;
  inStock: boolean;
  /**
   * Free text, not a fixed set.
   *
   * <p>It was `"New" | "Hot" | "Best Seller"`, and the home page inferred its New Arrivals section
   * from `badge === "New"`. A seller typing anything else emptied that section silently. Section
   * membership now comes from collections, so a badge is only ever a label.</p>
   */
  badge?: string;
  warranty: string;
  highlights: string[];
  description: string;
  specs: [string, string][];
  /**
   * Product photo. Absent for products with no upload, and the renderers fall back to the generated
   * art — which is also the fallback when the URL is present but fails to load, since RootCart emits
   * the URL whether or not an image exists behind it.
   */
  image?: string;
};

export type CartLine = {
  /**
   * RootCart's cart-line id. The line's identity — it was (slug, colour), which collapsed any
   * product whose options were not colours into a single line.
   */
  itemId: number;
  productId: number;
  variantId?: number;
  slug: string;
  name: string;
  price: number;
  lineTotal: number;
  /** Variant label. Named `color` because that is what the swatch UI calls it. */
  color: string;
  /** Category slug, kept on the line so the generated-art fallback can pick its glyph and tint. */
  category: string;
  quantity: number;
  /** Stock left for this variant, so the quantity stepper can stop at the ceiling. */
  stockQuantity?: number | null;
  image?: string;
};

/** Server-computed money for the current cart. The client never adds these up itself. */
export type CartTotals = {
  itemCount: number;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  shippingLabel: string;
  currency: string;
};
