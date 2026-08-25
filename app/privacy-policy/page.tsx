import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/section";
import { getSite } from "@/lib/rootcart/site";

export async function generateMetadata(): Promise<Metadata> {
  const storeSite = await getSite();
  return {
    title: "Privacy Policy",
    description: `How ${storeSite.name} collects, uses and protects customer information.`,
  };
}

export default async function PrivacyPage() {
  const storeSite = await getSite();

  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="What we collect, why we collect it, and what we never do with it."
        breadcrumb={[{ label: "Privacy Policy" }]}
      />
      <Prose>
        <p>
          This policy explains how {storeSite.legalName} handles the information you give
          us when you browse the store, place an order or contact support. It applies
          to this website only.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Order information:</strong> your name, mobile number, delivery
            address and any note you add at checkout.
          </li>
          <li>
            <strong>Payment reference:</strong> for mobile wallet payments we store
            the transaction ID you enter, not your wallet PIN or account balance.
          </li>
          <li>
            <strong>Support messages:</strong> whatever you write to us by form,
            email or chat, together with the number you contacted us from.
          </li>
          <li>
            <strong>Basic usage data:</strong> pages visited and device type, used
            only to fix layout problems and speed issues.
          </li>
        </ul>

        <h2>What we do with it</h2>
        <p>
          We use your details to pack and deliver the order, to call you if the
          address is unclear, to handle warranty claims, and to answer support
          questions. That is the whole list.
        </p>

        <h2>What we never do</h2>
        <ul>
          <li>We do not sell or rent customer lists to anyone.</li>
          <li>We do not store card numbers on our servers.</li>
          <li>
            We do not send marketing messages to numbers that have not asked for
            them.
          </li>
        </ul>

        <h2>Who else sees your data</h2>
        <p>
          Delivery partners receive your name, address and phone number so they can
          hand over the parcel. Payment providers see the transaction details needed
          to process a payment. Nobody else receives your information unless a
          lawful order requires it.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Order records are kept for as long as the warranty period runs, plus the
          period required for accounting. Support messages are kept for one year.
          You can ask us to delete anything that is no longer required.
        </p>

        <h2>Your choices</h2>
        <p>
          Write to <a href={`mailto:${storeSite.email}`}>{storeSite.email}</a> to see, correct
          or delete the information we hold about you. We respond within seven
          working days.
        </p>

        <h2>Changes</h2>
        <p>
          If this policy changes we update this page. Material changes are announced
          on the homepage for two weeks.
        </p>
      </Prose>
    </>
  );
}
