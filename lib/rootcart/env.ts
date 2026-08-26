/**
 * Where this storefront gets its data.
 *
 * Two values, both from the environment so the same build can point at staging or production:
 *
 * - `NEXT_PUBLIC_ROOTCART_API` — the base, e.g. `https://api.rootcart.shop/api/v1/storefront`
 * - `NEXT_PUBLIC_ROOTCART_KEY` — the publishable key (`rc_pk_…`) from
 *   Settings → Developers in the RootCart dashboard
 *
 * Optionally, the same two values under `ROOTCART_API` and `ROOTCART_KEY`, without the prefix. The
 * server prefers those because a name without `NEXT_PUBLIC_` is read at runtime instead of being
 * compiled in, so catalogue pages keep working when a platform withholds a variable from the build
 * (anything marked "sensitive" or "secret") or when it was set after the last build. The browser cart
 * can only ever use the `NEXT_PUBLIC_` pair — a browser has no environment to read.
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
export const isConfigured =
  apiBase !== "" && apiKey !== "" && !apiBase.includes(",") && !/\s/.test(apiBase);

/** A secret key in a NEXT_PUBLIC_ variable is a leak, not a misconfiguration — say so loudly. */
export const usesSecretKey = apiKey.startsWith("rc_sk_");

/**
 * True when someone put more than one URL in the variable.
 *
 * <p>Worth its own check because it fails silently and confusingly: the whole string becomes the base
 * URL, every fetch goes to an address that cannot resolve, and the site renders empty exactly as if
 * the store had no products. Some hosting panels do accept comma-separated domains, which is where
 * the habit comes from — this variable is a single URL.</p>
 */
export const hasMultipleUrls = apiBase.includes(",") || /\s/.test(apiBase);

/**
 * The same two values, read when they are needed rather than when the bundle was built.
 *
 * <p>Next replaces `process.env.NEXT_PUBLIC_*` with a string literal at build time so the browser can
 * see it. That is required for the cart, which runs in the browser — but it also freezes the value
 * into the compiled output. Set a variable after a build and the server keeps serving the old literal,
 * with no error: the site simply renders as if the store were empty.</p>
 *
 * <p>Server code has no such constraint. Reading inside a function keeps the lookup at runtime, where
 * the platform's current value lives, so catalogue pages recover as soon as the variable is set —
 * without waiting for a rebuild. The browser half still needs one, and always will.</p>
 */
function clean(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  // A comma-separated pair is a config mistake, not a fallback list — refuse it rather than build a
  // URL that cannot resolve.
  return trimmed.includes(",") || /\s/.test(trimmed) ? "" : trimmed;
}

export function serverApiBase(): string {
  // ROOTCART_API first, and it is read at runtime for a specific reason: Next substitutes every
  // `process.env.NEXT_PUBLIC_*` with a literal while compiling, so a NEXT_PUBLIC_ value that was not
  // available to the build is frozen empty for the life of that deployment. Hosting platforms that
  // mark a variable "sensitive" or "secret" withhold it from the build and expose it only at runtime,
  // which produces exactly that: present in process.env, empty in the compiled output. A name without
  // the prefix is never substituted, so it survives.
  const runtime = clean(process.env.ROOTCART_API);
  return runtime !== "" ? runtime : clean(process.env.NEXT_PUBLIC_ROOTCART_API);
}

export function serverApiKey(): string {
  const runtime = (process.env.ROOTCART_KEY ?? "").trim();
  return runtime !== "" ? runtime : (process.env.NEXT_PUBLIC_ROOTCART_KEY ?? "").trim();
}

export function serverIsConfigured(): boolean {
  return serverApiBase() !== "" && serverApiKey() !== "";
}

export function configProblem(): string | null {
  if (hasMultipleUrls) {
    return `NEXT_PUBLIC_ROOTCART_API must be one URL, but it contains a comma or a space: "${apiBase}". Keep a single value, e.g. https://api.rootcart.shop/api/v1/storefront`;
  }
  if (apiBase !== "" && !/^https?:\/\//.test(apiBase)) {
    return `NEXT_PUBLIC_ROOTCART_API must start with https:// — got "${apiBase}"`;
  }
  if (apiBase !== "" && !apiBase.includes("/api/v1/storefront")) {
    return `NEXT_PUBLIC_ROOTCART_API looks incomplete: "${apiBase}". It needs the full base, ending in /api/v1/storefront`;
  }
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
