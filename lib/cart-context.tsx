"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CartApiError, cartApi, writeCartSession } from "@/lib/rootcart/api";
import type { ApiCart, ApiOrder } from "@/lib/rootcart/types";
import type { CartLine, CartTotals, Product } from "@/lib/types";

/**
 * The cart, held by RootCart rather than by this browser.
 *
 * <p>It used to be a localStorage array of {slug, name, price, colour, quantity}, with the subtotal
 * summed on the client. That is fine for a demo and wrong for a shop: the price came from a bundled
 * catalogue, so editing one localStorage entry changed what the buyer was charged, and stock was
 * never checked until never. Lines are now references the server prices and validates.</p>
 *
 * <p>What this browser keeps is one opaque session token, which is how an anonymous visitor keeps a
 * cart across page loads without RootCart setting cookies on someone else's domain.</p>
 */

type AddOptions = {
  /** Preferred: the exact variant to add. */
  variantId?: number;
  /** Convenience for the swatch UI, which knows a label rather than an id. */
  color?: string;
  quantity?: number;
  /** Buy Now navigates instead, so it suppresses the drawer. */
  openDrawer?: boolean;
};

type CartContextValue = {
  lines: CartLine[];
  totals: CartTotals | null;
  /** Convenience mirror of totals.subtotal, which several headers and summaries read directly. */
  subtotal: number;
  count: number;
  /** False until the first cart read finishes, so nothing renders an empty cart prematurely. */
  ready: boolean;
  /** True while a write is in flight — the stepper and buttons disable on it. */
  busy: boolean;
  /** Message from the last failed call. The server's wording, which explains stock limits. */
  error: string | null;
  clearError: () => void;
  add: (product: Product, options?: AddOptions) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Re-prices delivery for an address without creating anything. */
  previewShipping: (city: string, district: string) => Promise<void>;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const emptyTotals: CartTotals = {
  itemCount: 0,
  subtotal: 0,
  shippingAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  shippingLabel: "",
  currency: "BDT",
};

function toLines(cart: ApiCart | null): CartLine[] {
  return (cart?.items ?? []).map((item) => ({
    itemId: item.id,
    productId: item.productId,
    variantId: item.variantId,
    slug: item.productSlug ?? String(item.productId),
    name: item.productName ?? "Item",
    price: item.unitPrice ?? 0,
    lineTotal: item.lineTotal ?? 0,
    color: item.variantName ?? "",
    category: "",
    quantity: item.quantity,
    stockQuantity: item.stockQuantity,
    image: item.imageUrl,
  }));
}

function toTotals(cart: ApiCart | null): CartTotals | null {
  const totals = cart?.totals;
  if (!totals) return null;
  return {
    itemCount: totals.itemCount ?? 0,
    subtotal: totals.subtotal ?? 0,
    shippingAmount: totals.shippingAmount ?? 0,
    taxAmount: totals.taxAmount ?? 0,
    totalAmount: totals.totalAmount ?? 0,
    shippingLabel: totals.shippingLabel ?? "",
    currency: totals.currency ?? "BDT",
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ApiCart | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const run = useCallback(async (action: () => Promise<ApiCart>) => {
    setBusy(true);
    setError(null);
    try {
      setCart(await action());
      return true;
    } catch (caught) {
      setError(
        caught instanceof CartApiError
          ? caught.message
          : "We could not reach the shop. Please try again.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setCart(await cartApi<ApiCart>("/cart"));
      setError(null);
    } catch (caught) {
      // A cart read failing on load is not worth an error banner over the whole site — the visitor
      // has not asked for anything yet. It is surfaced only once they try to act.
      if (caught instanceof CartApiError && caught.code === "not_configured") {
        setError(caught.message);
      }
      setCart(null);
    } finally {
      setReady(true);
    }
  }, []);

  // The first read is guarded by a mounted flag rather than fired and forgotten: the response can
  // land after a fast navigation away, and writing state into an unmounted provider is a leak.
  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const cart = await cartApi<ApiCart>("/cart");
        if (active) setCart(cart);
      } catch (caught) {
        if (active && caught instanceof CartApiError && caught.code === "not_configured") {
          setError(caught.message);
        }
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const add = useCallback<CartContextValue["add"]>(
    async (product, options) => {
      // A label is what the swatch row knows; the server needs the id behind it.
      const byColor = options?.color
        ? product.variants.find((variant) => variant.name === options.color)
        : undefined;
      const variantId = options?.variantId ?? byColor?.id ?? product.variants[0]?.id;

      const ok = await run(() =>
        cartApi<ApiCart>("/cart/items", {
          method: "POST",
          body: JSON.stringify({
            productId: Number(product.id),
            quantity: Math.max(1, options?.quantity ?? 1),
            ...(variantId ? { variantId } : {}),
          }),
        }),
      );

      // Opening the drawer is the caller's call now. Buy Now used to get a drawer thrown over the
      // checkout page it was navigating to.
      if (ok && options?.openDrawer !== false) setDrawerOpen(true);
    },
    [run],
  );

  const remove = useCallback<CartContextValue["remove"]>(
    async (itemId) => {
      await run(() => cartApi<ApiCart>(`/cart/items/${itemId}`, { method: "DELETE" }));
    },
    [run],
  );

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    async (itemId, quantity) => {
      if (quantity <= 0) {
        await run(() => cartApi<ApiCart>(`/cart/items/${itemId}`, { method: "DELETE" }));
        return;
      }
      await run(() =>
        cartApi<ApiCart>(`/cart/items/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        }),
      );
    },
    [run],
  );

  /**
   * Empties the cart one line at a time.
   *
   * <p>There is no clear-cart endpoint, so this is a loop. It runs sequentially rather than in
   * parallel because each response carries the whole cart, and concurrent writes would race to
   * decide which snapshot wins.</p>
   */
  const clear = useCallback(async () => {
    const items = cart?.items ?? [];
    if (items.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      let latest: ApiCart | null = null;
      for (const item of items) {
        latest = await cartApi<ApiCart>(`/cart/items/${item.id}`, { method: "DELETE" });
      }
      setCart(latest);
    } catch (caught) {
      setError(caught instanceof CartApiError ? caught.message : "Could not empty the cart.");
    } finally {
      setBusy(false);
    }
  }, [cart]);

  const previewShipping = useCallback<CartContextValue["previewShipping"]>(
    async (city, district) => {
      await run(() =>
        cartApi<ApiCart>("/checkout/summary", {
          method: "POST",
          body: JSON.stringify({ city, district }),
        }),
      );
    },
    [run],
  );

  const value = useMemo<CartContextValue>(() => {
    const lines = toLines(cart);
    const totals = toTotals(cart);

    return {
      lines,
      totals,
      subtotal: totals?.subtotal ?? 0,
      count: totals?.itemCount ?? lines.reduce((sum, line) => sum + line.quantity, 0),
      ready,
      busy,
      error,
      clearError: () => setError(null),
      add,
      remove,
      setQuantity,
      clear,
      refresh,
      previewShipping,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [cart, ready, busy, error, add, remove, setQuantity, clear, refresh, previewShipping, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export { emptyTotals };

/**
 * Places the order.
 *
 * <p>Lives beside the cart because it ends the cart's life. The idempotency key is generated per
 * attempt and reused across retries of that attempt, which is what stops a timed-out submit from
 * becoming two orders — the failure mode a buyer notices most.</p>
 */
export async function submitCheckout(
  payload: {
    customerName: string;
    customerEmail: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    paymentMethod: string;
  },
  idempotencyKey: string,
): Promise<ApiOrder> {
  const order = await cartApi<ApiOrder>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey,
  });

  // The server consumed the cart, so the token now points at nothing. Dropping it means the next
  // visit starts a fresh cart instead of reading an emptied one.
  writeCartSession(null);
  rememberOrder(order);
  return order;
}

const LAST_ORDER_KEY = "rootcart.last.order";

/**
 * Keeps the confirmation in this browser so the tracking page has something real to show.
 *
 * <p>RootCart has no public order-lookup endpoint, and the scope that would read one is deliberately
 * not browser-safe. So this is the honest limit of what a publishable key can offer: the buyer's own
 * last order on their own device. Anyone else — or the same buyer on another phone — is told to call
 * the shop rather than shown an invented timeline.</p>
 */
export function rememberOrder(order: ApiOrder) {
  cachedOrder = order;
  try {
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Storage blocked. The confirmation screen still shows the order; only tracking loses it.
  }
}

/**
 * Parsed once and cached.
 *
 * <p>The cache is what makes this safe to read from a render snapshot: parsing the JSON afresh would
 * hand back a new object every call, and a store snapshot that never compares equal loops forever.</p>
 */
let cachedOrder: ApiOrder | null | undefined;

export function readRememberedOrder(): ApiOrder | null {
  if (cachedOrder !== undefined) return cachedOrder;

  try {
    const raw = window.localStorage.getItem(LAST_ORDER_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cachedOrder =
      parsed && typeof parsed === "object" && "orderNumber" in parsed
        ? (parsed as ApiOrder)
        : null;
  } catch {
    cachedOrder = null;
  }
  return cachedOrder;
}
