/**
 * The credentials the cart uses in the browser.
 *
 * <p>The received wisdom is that a browser's credentials must be inlined at build time, because a
 * browser has no environment to read. That makes the cart hostage to whether the build had them, and
 * a build can miss them for reasons that have nothing to do with the code: a variable marked secret
 * is withheld from the build, a container image bakes in its own empty defaults, a value is set after
 * the last build. Each of those looks identical from outside — a cart that reports the store is not
 * connected — and none can be fixed without another build.</p>
 *
 * <p>So the compiled-in pair is a starting value, not the only one. The root layout reads the
 * environment on the server, where it is always current, and hands the pair down; {@link
 * setBrowserCredentials} applies it before anything can call the cart.</p>
 *
 * <p>This module deliberately contains no server-side environment reads. It is imported by client
 * components, which puts it in the client bundle, and anything reading an unprefixed variable here
 * would be compiled away to `undefined` without a warning — see `credentials.ts` for the server half.
 * That is not a hypothetical: it is how the first version of this got it wrong.</p>
 */

/** Trailing slashes make `${base}/products` become `//products`, so they are stripped once. */
function clean(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  // A comma-separated pair is a config mistake, not a fallback list — refuse it rather than build a
  // URL that cannot resolve.
  return trimmed.includes(",") || /\s/.test(trimmed) ? "" : trimmed;
}

let browserBase = clean(process.env.NEXT_PUBLIC_ROOTCART_API);
let browserKey = (process.env.NEXT_PUBLIC_ROOTCART_KEY ?? "").trim();

/**
 * Applies the pair the server read. Blank never overwrites a working value — the server may be the
 * one with nothing, and the compiled-in pair is a perfectly good fallback.
 */
export function setBrowserCredentials(base: string, key: string) {
  const cleaned = clean(base);
  if (cleaned !== "") browserBase = cleaned;
  if (key.trim() !== "") browserKey = key.trim();
}

export function browserApiBase(): string {
  return browserBase;
}

export function browserApiKey(): string {
  return browserKey;
}

export function browserIsConfigured(): boolean {
  return browserBase !== "" && browserKey !== "";
}
