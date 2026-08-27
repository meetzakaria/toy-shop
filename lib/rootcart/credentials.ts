/**
 * The server half of the cart's credentials: what gets handed down to the browser.
 *
 * <p>Kept in its own module, and imported only by server components, for a reason that costs a day to
 * find otherwise. A module imported by any `"use client"` file joins the client bundle, and in that
 * copy every unprefixed `process.env` read is compiled away to `undefined` — silently. Put this
 * function beside the browser helpers and it returns null on a server that has the variables set
 * perfectly well, which looks exactly like the variables being missing.</p>
 *
 * <p>Nothing here may be imported from a client component. The browser half lives in
 * `browser-credentials.ts`, which contains no unprefixed reads at all.</p>
 */

function clean(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  return trimmed.includes(",") || /\s/.test(trimmed) ? "" : trimmed;
}

/**
 * The pair to hand to the browser, or null when it must not be handed over.
 *
 * <p>A publishable key is meant to be public — it ships in the bundle by design, and RootCart binds it
 * to an origin allowlist. A secret key is not, and `ROOTCART_KEY` is an unprefixed variable that a
 * reasonable person might well fill with one, since everything else unprefixed is server-only. So the
 * prefix is checked rather than assumed: a secret key stays on the server and the cart falls back to
 * the compiled-in pair, which cannot hold one without `configProblem` reporting it.</p>
 */
export function publishableCredentials(): { apiBase: string; apiKey: string } | null {
  const base = clean(process.env.ROOTCART_API) || clean(process.env.NEXT_PUBLIC_ROOTCART_API);
  const key =
    (process.env.ROOTCART_KEY ?? "").trim() || (process.env.NEXT_PUBLIC_ROOTCART_KEY ?? "").trim();

  if (base === "" || key === "" || key.startsWith("rc_sk_")) return null;
  return { apiBase: base, apiKey: key };
}
