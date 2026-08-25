import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@/components/accordion";
import { PageHeader } from "@/components/section";
import { faqs } from "@/lib/data/content";
import { getSite } from "@/lib/rootcart/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to the questions we are asked most: ordering, payment, delivery times, warranty, returns and support.",
};

export default async function FaqPage() {
  const storeSite = await getSite();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title="Frequently Asked Questions"
        description="Ordering, payment, delivery and warranty — answered in plain language."
        breadcrumb={[{ label: "FAQ" }]}
      />
      <div className="container-page max-w-3xl py-10">
        <Accordion items={faqs} />
        <div className="mt-8 rounded-xl border border-line bg-surface p-6 text-center">
          <p className="font-semibold">Still stuck on something?</p>
          <p className="mt-1 text-sm text-muted">
            Call {storeSite.hotline} or send us a message — we answer every one.
          </p>
          <Link
            href="/contact-us"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </>
  );
}
