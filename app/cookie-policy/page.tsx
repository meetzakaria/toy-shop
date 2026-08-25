import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/section";
import { getSite } from "@/lib/rootcart/site";

export async function generateMetadata(): Promise<Metadata> {
  const storeSite = await getSite();
  return {
    title: "Cookie Policy",
    description: `Which cookies and browser storage ${storeSite.name} uses, and how to control them.`,
  };
}

export default async function CookiePolicyPage() {
  const storeSite = await getSite();

  return (
    <>
      <PageHeader
        title="Cookie Policy"
        description="What this site stores in your browser and why."
        breadcrumb={[{ label: "Cookie Policy" }]}
      />
      <Prose>
        <p>
          This store keeps a small amount of data in your browser so the basics work
          — mainly your shopping cart. Nothing here identifies you personally.
        </p>

        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Cart contents.</strong> Saved in local storage so your cart
            survives a page refresh or a closed tab. It stays on your device and is
            never sent anywhere until you place an order.
          </li>
          <li>
            <strong>Session basics.</strong> Standard cookies your browser needs to
            keep a page working correctly during a visit.
          </li>
          <li>
            <strong>Anonymous usage counts.</strong> If analytics are enabled, they
            record page views and device type without names or numbers.
          </li>
        </ul>

        <h2>What we do not store</h2>
        <p>
          No advertising trackers, no cross-site profiling, no card details in the
          browser.
        </p>

        <h2>Controlling storage</h2>
        <p>
          Clearing site data in your browser settings removes everything this site
          has saved, including the cart. Blocking cookies entirely still lets you
          browse, but the cart will empty on every page load.
        </p>

        <h2>Third parties</h2>
        <p>
          Chat and social buttons link out to their own platforms. Once you follow
          one of those links, that platform&apos;s cookie policy applies, not ours.
        </p>

        <h2>Questions</h2>
        <p>
          Write to <a href={`mailto:${storeSite.email}`}>{storeSite.email}</a> if you want
          detail on anything stored here.
        </p>
      </Prose>
    </>
  );
}
