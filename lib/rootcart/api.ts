import { apiBase, apiKey, isConfigured } from "@/lib/rootcart/env";
import type { ApiEnvelope, ApiPageMeta } from "@/lib/rootcart/types";

/**
 * The one place this storefront talks to RootCart.
 *
 * Two callers with different needs, so two functions:
 *
 * - {@link readApi} runs on the server for catalogue reads. Next 16 makes caching opt-in, so every
 *   read names its own revalidation window and a tag, which lets a webhook or a manual
 *   `revalidateTag` push new prices without a redeploy.
 * - {@link cartApi} runs in the browser for the cart. It is never cached — a cart that renders from
 *   a cache is a cart that shows the wrong total — and it carries the cart session token.
 */

/** Cache tags, so one call can invalidate a whole family of reads. */
export const TAGS = {
  catalog: "rootcart-catalog",
  config: "rootcart-config",
  content: "rootcart-content",
} as const;

/** Prices and stock move; a minute of staleness is the trade for not hitting the API per visitor. */
export const REVALIDATE = {
  catalog: 60,
  config: 300,
  content: 300,
} as const;

export type ReadResult<T> = {
  data: T | null;
  meta: ApiPageMeta | null;
  /** Null on success. A human-readable reason on failure — never thrown, so a page can degrade. */
  error: string | null;
};

type ReadOptions = {
  revalidate?: number;
  tags?: string[];
};

/**
 * Server-side read.
 *
 * <p>Returns a result object instead of throwing. A storefront that 500s because the API had a bad
 * minute is worse than one that renders its shell with an empty section, and the caller is always in
 * a better position to decide which sections are essential.</p>
 */
export async function readApi<T>(
  path: string,
  options: ReadOptions = {},
): Promise<ReadResult<T>> {
  if (!isConfigured) {
    return { data: null, meta: null, error: "RootCart is not configured." };
  }

  const url = `${apiBase}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-RootCart-Key": apiKey,
      },
      next: {
        revalidate: options.revalidate ?? REVALIDATE.catalog,
        tags: options.tags ?? [TAGS.catalog],
      },
    });

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

    if (!response.ok || !payload?.success) {
      // error.code is the stable contract; the message wording is not, so the code leads.
      const code = payload?.error?.code ?? `http_${response.status}`;
      const message = payload?.error?.message ?? response.statusText;
      // Logged, not just returned: the caller degrades to an empty section, so without this a
      // rejected key and an empty catalogue look identical from outside — an empty page either way.
      console.error(`[rootcart] ${path} → ${code}: ${message}`);
      return { data: null, meta: null, error: `${code}: ${message}` };
    }

    return { data: payload.data ?? null, meta: payload.meta ?? null, error: null };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unknown network error";
    // fetch rejects the same way for DNS failures, refused connections and TLS problems, and the
    // cause is the only thing that tells them apart — so it is logged alongside.
    const cause = (caught as { cause?: { code?: string; message?: string } })?.cause;
    console.error(
      `[rootcart] ${url} → could not connect: ${message}`,
      cause?.code ?? cause?.message ?? "",
    );
    return { data: null, meta: null, error: `network: ${message}` };
  }
}

// ---------------------------------------------------------------- browser cart

const SESSION_KEY = "rootcart.cart.session";

/**
 * The cart's identity, kept in localStorage.
 *
 * <p>RootCart deliberately does not set a cookie on this domain — it is not RootCart's domain — so
 * holding the token is the storefront's job. Lose it and the buyer gets a fresh empty cart, which is
 * why it is read defensively rather than assumed.</p>
 */
export function readCartSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeCartSession(token: string | null) {
  try {
    if (token) window.localStorage.setItem(SESSION_KEY, token);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked (private window, cookie-blocking extension). The cart still works for this
    // page view; it just will not survive a reload.
  }
}

export class CartApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CartApiError";
    this.code = code;
  }
}

/**
 * Browser-side cart call. Throws {@link CartApiError} so the UI can show the seller's own message —
 * "Only 3 item(s) are available right now" is worth surfacing verbatim.
 */
export async function cartApi<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  if (!isConfigured) {
    throw new CartApiError("not_configured", "This store is not connected to RootCart yet.");
  }

  const session = readCartSession();
  const { idempotencyKey, ...rest } = init;

  const response = await fetch(`${apiBase}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      "X-RootCart-Key": apiKey,
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(session ? { "X-RootCart-Cart-Session": session } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...(rest.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    const code = payload?.error?.code ?? `http_${response.status}`;
    const message = payload?.error?.message ?? "That did not work. Please try again.";
    // Browser console, because this is the half a server log never sees: a cart call fails from the
    // visitor's browser with an Origin header the server-side reads never send.
    console.error(`[rootcart cart] ${path} → ${code}: ${message}`);
    if (code === "origin_not_allowed") {
      console.error(
        `[rootcart cart] Add ${window.location.origin} to this key's allowed origins in RootCart → Settings → Developers.`,
      );
    }
    throw new CartApiError(code, message);
  }

  // The token arrives in the body as well as the header; the body is used because a cross-origin
  // response only exposes headers the server allow-lists, and reading it here needs no CORS setup.
  const data = payload.data as T & { sessionToken?: string };
  if (data && typeof data === "object" && typeof data.sessionToken === "string") {
    writeCartSession(data.sessionToken);
  }

  return data;
}
