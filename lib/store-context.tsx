"use client";

import { createContext, useContext, useMemo } from "react";
import { setBrowserCredentials } from "@/lib/rootcart/browser-credentials";
import type { Category } from "@/lib/types";

/**
 * Store data that client components need synchronously during render.
 *
 * <p>The categories are fetched once by the root layout — a server component — and handed down here.
 * The alternative was importing a static array, which is what the template did before: correct for a
 * hardcoded catalogue, impossible once the categories belong to a seller who edits them.</p>
 *
 * <p>A client component cannot be async and cannot await at module scope, so this exists to keep the
 * lookup synchronous where it has to be: the generated product art resolves a category's glyph and
 * tint during render, on every tile on the page.</p>
 */

export type StoreBrand = {
  name: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  paymentMethods: string[];
};

type StoreContextValue = {
  categories: Category[];
  brand: StoreBrand | null;
};

const StoreContext = createContext<StoreContextValue>({ categories: [], brand: null });

export function StoreProvider({
  categories,
  brand,
  credentials,
  children,
}: {
  categories: Category[];
  brand: StoreBrand | null;
  /** Read from the environment on the server, so the cart does not depend on the build. */
  credentials: { apiBase: string; apiKey: string } | null;
  children: React.ReactNode;
}) {
  // Applied during render rather than in an effect, because the first cart call can be triggered by a
  // click that lands before effects have flushed. It writes a module variable, not React state, and
  // the same values produce the same result, so re-running it is a no-op.
  if (credentials) {
    setBrowserCredentials(credentials.apiBase, credentials.apiKey);
  }

  const value = useMemo<StoreContextValue>(() => ({ categories, brand }), [categories, brand]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCategories(): Category[] {
  return useContext(StoreContext).categories;
}

/**
 * A category by slug, or undefined.
 *
 * <p>Undefined is a normal outcome, not an error: a product can point at a category the seller has
 * since deactivated, and its tile should still draw with a fallback rather than blank the page.</p>
 */
export function useCategoryBySlug(slug: string): Category | undefined {
  const categories = useCategories();
  return categories.find((category) => category.slug === slug);
}

/** Brand details for client components. Null before the store config has ever loaded. */
export function useBrand(): StoreBrand | null {
  return useContext(StoreContext).brand;
}
