/**
 * The shapes RootCart's Storefront API v1 actually returns.
 *
 * Deliberately separate from `lib/types.ts`. Those are the template's own display types, which the
 * 22 pages and 17 components are written against; these mirror the wire format. Keeping them apart
 * means a change on either side shows up as a type error in `lib/rootcart/map.ts` — one file — rather
 * than rippling through the UI.
 *
 * Every field here is optional-tolerant where the API marks it NON_NULL-omitted, so a store that has
 * not filled something in cannot crash a render.
 */

export type ApiEnvelope<T> = {
  success: boolean;
  apiVersion: string;
  requestId?: string;
  data?: T;
  meta?: ApiPageMeta;
  error?: { code: string; message: string; field?: string | null };
};

export type ApiPageMeta = {
  limit: number;
  returned: number;
  hasMore: boolean;
  /** Opaque. Pass back as `cursor`; never construct one. */
  nextCursor?: string | null;
};

export type ApiVariant = {
  id: number;
  sku?: string;
  /** Free text the seller typed — "Blue", "1 kg", "Blue / L". The only human label a variant has. */
  name?: string;
  price?: number;
  stockQuantity?: number | null;
  trackInventory?: boolean;
};

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  subcategory?: string;
  /** URL handle of the category — the routing key, alongside the display name above. */
  categorySlug?: string;
  subcategorySlug?: string;
  price?: number;
  unit?: string;
  organic?: boolean;
  farmFresh?: boolean;
  status?: string;
  stockQuantity?: number | null;
  inStock?: boolean;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  variants?: ApiVariant[];
  /** Seller-defined extras, keyed `namespace.field_key`. Present only with `include=metafields`. */
  metafields?: Record<string, unknown>;
};

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  parentName?: string | null;
  sortOrder?: number;
  iconUrl?: string | null;
  productCount?: number;
  metafields?: Record<string, unknown>;
};

export type ApiCollection = {
  slug: string;
  title: string;
  description?: string | null;
  productCount?: number;
};

export type ApiConfig = {
  store: {
    id: number;
    name: string;
    slug: string;
    subdomain?: string;
    customDomain?: string | null;
    domainVerified?: boolean;
    storefrontMode?: "hosted" | "headless";
    brandType?: string;
    active?: boolean;
  };
  theme: {
    templateId?: string;
    templateName?: string;
    primaryColor?: string;
    accentColor?: string;
    heroHeadline?: string;
    heroSubheadline?: string;
  };
  branding: {
    logoUrl?: string;
    bannerUrl?: string;
    aboutHeadline?: string;
    aboutDescription?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
  };
  commerce: {
    currency?: string;
    timezone?: string;
    paymentMethods?: string[];
    averageRating?: number;
    reviewCount?: number;
    productCount?: number;
    /** The seller's delivery zones. Empty when they have defined none. */
    shippingZones?: { name: string; rate?: number }[];
  };
  capabilities?: string[];
  /** Store-wide seller-defined extras. Always present on config, unlike on products. */
  metafields?: Record<string, unknown>;
};

// ---------------------------------------------------------------- cart

export type ApiCartItem = {
  id: number;
  productId: number;
  /** URL handle, so a cart line can link back to its product page. */
  productSlug?: string;
  variantId?: number;
  productName?: string;
  variantName?: string;
  imageUrl?: string;
  quantity: number;
  stockQuantity?: number | null;
  unitPrice?: number;
  lineTotal?: number;
  organic?: boolean;
};

export type ApiCartTotals = {
  itemCount: number;
  subtotal?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  shippingLabel?: string;
  currency?: string;
};

export type ApiCart = {
  /** The cart's identity. Store it and send it back in `X-RootCart-Cart-Session`. */
  sessionToken?: string;
  items?: ApiCartItem[];
  totals?: ApiCartTotals;
  availablePaymentMethods?: string[];
};

// ---------------------------------------------------------------- checkout

export type ApiOrder = {
  id?: number;
  orderNumber?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  customer?: { name?: string; email?: string; phone?: string };
  shipping?: { address?: string; city?: string; district?: string };
  totals?: {
    subtotal?: number;
    shippingAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
    currency?: string;
  };
  items?: {
    productName?: string;
    variantName?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
  }[];
  /** True when this response replayed an earlier request with the same Idempotency-Key. */
  idempotentReplay?: boolean;
};

export type ApiContentEntry = {
  type: string;
  slug: string;
  title: string;
  data?: Record<string, unknown>;
  sortOrder?: number;
  publishedAt?: string;
};
