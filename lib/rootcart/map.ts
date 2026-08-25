import type { Category, IconName, Product, ProductVariant } from "@/lib/types";
import type { ApiCategory, ApiProduct } from "@/lib/rootcart/types";

/**
 * Translates RootCart's wire shape into the display types the UI is written against.
 *
 * <p>This is the only file that knows both sides, which is the point: the 22 pages and 17 components
 * keep working against `Product` and `Category`, and an API change lands here as one type error.</p>
 *
 * <p>Everything the template needs that RootCart does not model natively comes from a custom field
 * (a "metafield"). The seller defines these in Content → Custom fields; the namespace is `shop` and
 * the keys are listed in {@link METAFIELDS}. Every one is optional — a store that has defined none
 * still renders, just without warranties or spec tables.</p>
 */

/** The custom fields this template reads. Give this list to the seller to set up. */
export const METAFIELDS = {
  /** product · string — manufacturer name shown above the product title. */
  brand: "shop.brand",
  /** product · number — the struck-through "was" price, which drives the discount badge. */
  oldPrice: "shop.old_price",
  /** product · string — warranty sentence on the product page. */
  warranty: "shop.warranty",
  /** product · json — array of short selling points. */
  highlights: "shop.highlights",
  /** product · json — array of [label, value] pairs for the spec table. */
  specs: "shop.specs",
  /** product · string — corner ribbon text, e.g. "Hot". Free text; any label renders. */
  badge: "shop.badge",
  /** category · string — one of the template's glyph names. See ICON_NAMES. */
  categoryIcon: "shop.icon",
  /** category · string — 6-digit hex tint for the category's generated art. */
  categoryHue: "shop.hue",
  /** category · text — one-line description under the category name. */
  categoryBlurb: "shop.blurb",
} as const;

/**
 * The glyphs the template can draw. A category's `shop.icon` must be one of these.
 *
 * <p>Closed on purpose: each name maps to a hand-drawn SVG in `components/icons.tsx`, so a value
 * outside the list has nothing to render. Anything unrecognised falls back rather than crashing.</p>
 */
export const ICON_NAMES: readonly IconName[] = [
  "headphones",
  "cable",
  "bolt",
  "keyboard",
  "watch",
  "tv",
  "car",
  "fan",
];

/** Palette used when a seller has not set `shop.hue`. Stable per category so tiles never reshuffle. */
const FALLBACK_HUES = [
  "#659900",
  "#0ea5e9",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

// ---------------------------------------------------------------- metafield readers

function metafield(source: Record<string, unknown> | undefined, key: string): unknown {
  return source ? source[key] : undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry));
}

/**
 * Reads a spec table, accepting the two shapes a seller might reasonably type into a JSON field:
 * `[["Driver","11 mm"], …]` and `[{"label":"Driver","value":"11 mm"}, …]`.
 */
function asPairs(value: unknown): [string, string][] {
  if (!Array.isArray(value)) return [];

  const pairs: [string, string][] = [];
  for (const entry of value) {
    if (Array.isArray(entry) && entry.length >= 2) {
      const label = asString(entry[0]);
      const detail = asString(entry[1]);
      if (label && detail) pairs.push([label, detail]);
      continue;
    }
    if (entry && typeof entry === "object") {
      const row = entry as Record<string, unknown>;
      const label = asString(row.label ?? row.key ?? row.name);
      const detail = asString(row.value ?? row.detail);
      if (label && detail) pairs.push([label, detail]);
    }
  }
  return pairs;
}

/**
 * Forces a colour to the 6-digit hex the generated art needs.
 *
 * <p>The art composites alpha by appending two hex digits (`${hue}1a`), so `red`, `#f00` or
 * `rgb(…)` would produce invalid CSS and the tile would silently lose its tint. Three-digit hex is
 * expanded; anything else is refused so the caller can fall back to the palette.</p>
 */
export function normalizeHex(value: unknown): string | undefined {
  const text = asString(value);
  if (!text) return undefined;

  const hex = text.startsWith("#") ? text.slice(1) : text;
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const [r, g, b] = hex.toLowerCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return undefined;
}

/** Deterministic glyph for a category with no `shop.icon`, so it is stable across renders. */
function fallbackIcon(slug: string): IconName {
  let hash = 0;
  for (const character of slug) hash = (hash * 31 + character.charCodeAt(0)) % 100000;
  return ICON_NAMES[hash % ICON_NAMES.length];
}

// ---------------------------------------------------------------- products

export function toProduct(api: ApiProduct): Product {
  const fields = api.metafields;

  const variants: ProductVariant[] = (api.variants ?? []).map((variant) => ({
    id: variant.id,
    name: asString(variant.name) ?? "Default",
    price: asNumber(variant.price) ?? asNumber(api.price) ?? 0,
    // trackInventory off means the seller is not counting, which is availability, not absence.
    inStock: variant.trackInventory === true ? (variant.stockQuantity ?? 0) > 0 : true,
  }));

  // Colour swatches are the variant labels. RootCart has no option/value model — a variant's only
  // human attribute is its free-text name — so "Blue" and "1 kg" arrive the same way and the picker
  // shows whatever the seller typed. With a single variant there is nothing to choose, so no swatches.
  const colors = variants.length > 1 ? variants.map((variant) => variant.name) : [];

  const oldPrice = asNumber(metafield(fields, METAFIELDS.oldPrice));
  const price = asNumber(api.price) ?? 0;

  return {
    id: String(api.id),
    slug: api.slug,
    name: api.name,
    brand: asString(metafield(fields, METAFIELDS.brand)) ?? "",
    // The slug, not the display name: this is the routing and filtering key.
    category: api.categorySlug ?? "",
    categoryName: asString(api.category) ?? "",
    price,
    // A "was" price below the current price would render a negative discount, so it is dropped.
    oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
    colors,
    variants,
    rating: asNumber(api.rating) ?? 0,
    reviews: api.reviewCount ?? 0,
    inStock: api.inStock !== false,
    badge: asString(metafield(fields, METAFIELDS.badge)),
    warranty: asString(metafield(fields, METAFIELDS.warranty)) ?? "",
    highlights: asStringArray(metafield(fields, METAFIELDS.highlights)),
    description: asString(api.description) ?? "",
    specs: asPairs(metafield(fields, METAFIELDS.specs)),
    // Emitted by the API whether or not a photo was uploaded, so it is kept optional and every
    // renderer falls back to the generated art when it fails to load.
    image: asString(api.imageUrl),
  };
}

// ---------------------------------------------------------------- categories

export function toCategory(api: ApiCategory, index: number): Category {
  const fields = api.metafields;
  const icon = asString(metafield(fields, METAFIELDS.categoryIcon));

  return {
    slug: api.slug,
    name: api.name,
    blurb: asString(metafield(fields, METAFIELDS.categoryBlurb)) ?? "",
    icon: ICON_NAMES.includes(icon as IconName) ? (icon as IconName) : fallbackIcon(api.slug),
    hue:
      normalizeHex(metafield(fields, METAFIELDS.categoryHue)) ??
      FALLBACK_HUES[index % FALLBACK_HUES.length],
    productCount: api.productCount ?? 0,
  };
}
