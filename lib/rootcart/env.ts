/**
 * Where this storefront gets its data.
 *
 * Two values, both from the environment so the same build can point at staging or production:
 *
 * - `NEXT_PUBLIC_ROOTCART_API` — the base, e.g. `https://api.rootcart.shop/api/v1/storefront`
 * - `NEXT_PUBLIC_ROOTCART_KEY` — the publishable key (`rc_pk_…`) from
 *   Settings → Developers in the RootCart dashboard
 *
 * Both are `NEXT_PUBLIC_` because the cart runs in the browser. That is safe for a publishable
 * key and only a publishable key: it is readable by anyone who opens the site, which is why
 * RootCart binds it to an origin allowlist. A secret key (`rc_sk_…`) must never appear here —
 * the API refuses one that arrives with a browser `Origin` header, but the leak would already
 * have happened.
 */

const RAW_BASE = process.env.NEXT_PUBLIC_ROOTCART_API ?? "";
const RAW_KEY = process.env.NEXT_PUBLIC_ROOTCART_KEY ?? "";

/** Trailing slashes make `${base}/products` become `//products`, so they are stripped once here. */
export const apiBase = RAW_BASE.trim().replace(/\/+$/, "");

export const apiKey = RAW_KEY.trim();

/**
 * True when both values are present.
 *
 * Every loader checks this and falls back to an empty catalogue rather than throwing, so a
 * developer who clones this repo and runs `npm run dev` before writing `.env.local` sees the
 * site render with a clear empty state instead of a stack trace.
 */
export const isConfigured = apiBase !== "" && apiKey !== "";

/** A secret key in a NEXT_PUBLIC_ variable is a leak, not a misconfiguration — say so loudly. */
export const usesSecretKey = apiKey.startsWith("rc_sk_");

export function configProblem(): string | null {
  if (usesSecretKey) {
    return "NEXT_PUBLIC_ROOTCART_KEY holds a secret key (rc_sk_…). Revoke it in RootCart and use a publishable key (rc_pk_…) — anything NEXT_PUBLIC_ is visible to every visitor.";
  }
  if (apiBase === "" && apiKey === "") {
    return "Set NEXT_PUBLIC_ROOTCART_API and NEXT_PUBLIC_ROOTCART_KEY in .env.local. Both come from Settings → Developers in your RootCart dashboard.";
  }
  if (apiBase === "") {
    return "NEXT_PUBLIC_ROOTCART_API is not set. Copy the API base URL from Settings → Developers.";
  }
  if (apiKey === "") {
    return "NEXT_PUBLIC_ROOTCART_KEY is not set. Create a publishable key in Settings → Developers.";
  }
  return null;
}
