import {
  apiBase,
  apiKey,
  configProblem,
  serverApiBase,
  serverApiKey,
  serverIsConfigured,
} from "@/lib/rootcart/env";

/**
 * A one-URL health check for the RootCart connection.
 *
 * <p>Open `/rootcart-check` in a browser and it reports, in order, exactly where the chain breaks:
 * whether the env vars reached this build, whether the API host answers at all, whether TLS holds,
 * whether the key is accepted, and whether the store has anything to sell. Each of those fails
 * differently and the site looks identical for all of them — an empty shop — which is what makes
 * debugging it from the outside so slow.</p>
 *
 * <p>Never cached, so a redeploy or a backend fix shows up on the next refresh.</p>
 *
 * <p>Safe to delete once the connection is working. It exposes no secret: the key is masked, and the
 * API base URL is already readable in the browser bundle by design.</p>
 */
export const dynamic = "force-dynamic";

type Step = {
  step: string;
  ok: boolean;
  detail: string;
  fix?: string;
};

/** Enough of the key to recognise which one is deployed, not enough to use it. */
function maskKey(key: string): string {
  if (!key) return "(empty)";
  const cut = key.lastIndexOf("_");
  const prefix = cut > 0 ? key.slice(0, cut) : key.slice(0, 12);
  return `${prefix}_…${key.slice(-4)}`;
}

export async function GET() {
  const steps: Step[] = [];
  const started = Date.now();

  /**
   * Which deployment is answering, according to the host itself.
   *
   * <p>This is the difference between guessing and knowing. `VERCEL_ENV` says whether this build is
   * production or preview, and environment variables are scoped per environment — a Production-scoped
   * variable is simply absent from a Preview build, which looks identical to never having set it.</p>
   */
  const platform = {
    vercelEnv: process.env.VERCEL_ENV ?? "(not on Vercel)",
    vercelUrl: process.env.VERCEL_URL ?? "(none)",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "(none)",
    commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "(none)").slice(0, 7),
    /** Names only, never values — proves whether they arrived at all. */
    rootcartVarsSeen: Object.keys(process.env)
      .filter((name) => name.startsWith("NEXT_PUBLIC_"))
      .sort(),
  };

  steps.push({
    step: "0. Which deployment is this",
    ok: platform.rootcartVarsSeen.length > 0,
    detail: `env=${platform.vercelEnv} · branch=${platform.branch} · commit=${platform.commit} · NEXT_PUBLIC_ vars present: ${
      platform.rootcartVarsSeen.length > 0 ? platform.rootcartVarsSeen.join(", ") : "NONE"
    }`,
    fix:
      platform.rootcartVarsSeen.length > 0
        ? undefined
        : `No NEXT_PUBLIC_ variable reached this build at all. If env above is "preview", the variables are scoped to Production only — either add them to Preview as well, or open the Production deployment. Vercel scopes variables per environment.`,
  });

  // ---------------------------------------------------------------- 1. env, both ways
  // Reported separately because they disagree in exactly one situation, and that situation is the
  // hardest to diagnose: a variable set after the last build is live at runtime and stale in the
  // bundle. Server pages then work while the browser cart does not.
  const problem = configProblem();
  const buildTimeOk = apiBase !== "" && apiKey !== "" && !problem;
  const runtimeOk = serverIsConfigured();

  steps.push({
    step: "1a. Environment at runtime (server pages, catalogue)",
    ok: runtimeOk,
    detail: runtimeOk
      ? `API base: ${serverApiBase()} · key: ${maskKey(serverApiKey())} · source: ${
          process.env.ROOTCART_API ? "ROOTCART_API (runtime)" : "NEXT_PUBLIC_ROOTCART_API (compiled in)"
        }`
      : `Nothing readable. ROOTCART_API="${process.env.ROOTCART_API ?? ""}" · NEXT_PUBLIC_ROOTCART_API="${apiBase}"`,
    fix: runtimeOk
      ? undefined
      : "Add ROOTCART_API and ROOTCART_KEY — same two values, WITHOUT the NEXT_PUBLIC_ prefix. Those are read at runtime, so they work even when the platform keeps a variable out of the build, and they fix the catalogue without a rebuild.",
  });

  /**
   * The literal values this build was compiled with, quoted so they can be compared character for
   * character against the dashboard.
   *
   * <p>Reported even when empty, and including SITE_URL, because "empty" and "set to the wrong thing"
   * need different fixes and look identical from outside. A local development value appearing here
   * means the build did receive variables — just not the ones intended.</p>
   */
  const bakedIn = [
    `NEXT_PUBLIC_ROOTCART_API="${apiBase}"`,
    `NEXT_PUBLIC_ROOTCART_KEY="${maskKey(apiKey)}"`,
    `NEXT_PUBLIC_SITE_URL="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}"`,
  ].join(" · ");

  steps.push({
    step: "1b. Environment baked into the bundle (browser cart)",
    ok: buildTimeOk,
    detail: buildTimeOk
      ? bakedIn
      : `${problem ?? "Empty in the compiled output."} — what this build actually received: ${bakedIn}`,
    fix: buildTimeOk
      ? undefined
      : "A NEW BUILD is required; changing the variable is not enough. Push a commit to main, or Redeploy with 'Use existing Build Cache' UNCHECKED. Until then product pages work but the cart will not.",
  });

  if (!runtimeOk) {
    return Response.json({ healthy: false, steps }, { status: 503 });
  }

  // ---------------------------------------------------------------- 2..4. one live call
  let response: Response | null = null;
  let networkError: string | null = null;

  try {
    response = await fetch(`${serverApiBase()}/config`, {
      headers: { Accept: "application/json", "X-RootCart-Key": serverApiKey() },
      cache: "no-store",
    });
  } catch (caught) {
    // fetch rejects for DNS failure, refused connections and TLS problems alike, and the message is
    // the only thing that distinguishes them — so it is passed through verbatim.
    networkError = caught instanceof Error ? `${caught.name}: ${caught.message}` : String(caught);
    const cause = (caught as { cause?: { code?: string; message?: string } })?.cause;
    if (cause?.code || cause?.message) {
      networkError += ` (cause: ${cause.code ?? ""} ${cause.message ?? ""})`.trimEnd();
    }
  }

  steps.push({
    step: "2. API host reachable (DNS + TCP + TLS)",
    ok: response !== null,
    detail: response ? `Connected, HTTP ${response.status}` : `Could not connect — ${networkError}`,
    fix: response
      ? undefined
      : "Most often the certificate. If it says 'self-signed', 'unable to verify' or 'UNTRUSTED_ROOT', the domain has no real certificate — in Coolify, set the resource's domain to the full https:// URL and redeploy so Traefik requests one from Let's Encrypt.",
  });

  if (!response) {
    return Response.json({ healthy: false, steps }, { status: 503 });
  }

  const raw = await response.text();
  let payload: { success?: boolean; data?: unknown; error?: { code?: string; message?: string } } | null =
    null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = null;
  }

  steps.push({
    step: "3. Reaching RootCart itself",
    ok: payload !== null,
    detail:
      payload !== null
        ? "Got a RootCart JSON response"
        : `Not RootCart — HTTP ${response.status}, body starts: ${raw.slice(0, 120)}`,
    fix:
      payload !== null
        ? undefined
        : "Something answered but it is not the API. A short 404 usually means the reverse proxy has no route for this hostname, so the request never reached the backend. Check the domain on the backend resource.",
  });

  steps.push({
    step: "4. API key accepted",
    ok: payload?.success === true,
    detail:
      payload?.success === true
        ? "Key valid, scopes sufficient"
        : `${payload?.error?.code ?? "unknown"}: ${payload?.error?.message ?? raw.slice(0, 120)}`,
    fix:
      payload?.success === true
        ? undefined
        : "invalid_api_key → the key does not match this store. origin_not_allowed → add this site's origin to the key. api_key_revoked → create a new one.",
  });

  // ---------------------------------------------------------------- 5. does the store have stock
  let productCount: number | null = null;
  if (payload?.success) {
    try {
      const products = await fetch(`${serverApiBase()}/products?limit=3`, {
        headers: { Accept: "application/json", "X-RootCart-Key": serverApiKey() },
        cache: "no-store",
      });
      const body = (await products.json()) as { data?: unknown[] };
      productCount = Array.isArray(body.data) ? body.data.length : 0;
    } catch {
      productCount = null;
    }

    steps.push({
      step: "5. Store has published products",
      ok: (productCount ?? 0) > 0,
      detail:
        productCount === null
          ? "Could not read the catalogue"
          : `${productCount} product(s) returned`,
      fix:
        (productCount ?? 0) > 0
          ? undefined
          : "The connection works but this store has nothing to show. Add products in the RootCart dashboard and make sure they are active. An empty catalogue renders an empty site — including no hero.",
    });
  }

  const healthy = steps.every((entry) => entry.ok);

  return Response.json(
    {
      healthy,
      checkedAt: new Date().toISOString(),
      tookMs: Date.now() - started,
      platform,
      summary: healthy
        ? "Connected. If the site still looks empty, redeploy so pages re-render with fresh data."
        : `First failure: ${steps.find((entry) => !entry.ok)?.step}`,
      steps,
    },
    { status: healthy ? 200 : 503 },
  );
}
