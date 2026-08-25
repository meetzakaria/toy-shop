import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose } from "@/components/section";
import { getSite } from "@/lib/rootcart/site";

export const metadata: Metadata = {
  title: "Return and Refund",
  description:
    "When you can return an item, how replacements work, and how long refunds take.",
};

export default async function ReturnPage() {
  const storeSite = await getSite();

  return (
    <>
      <PageHeader
        title="Return and Refund"
        description="Seven days to report a problem — here is exactly how it works."
        breadcrumb={[{ label: "Return and Refund" }]}
      />
      <Prose>
        <h2>The short version</h2>
        <p>
          If a product arrives faulty, damaged or is not what you ordered, tell us
          within seven days of delivery and we replace it. If we cannot replace it,
          you get your money back.
        </p>

        <h2>What qualifies</h2>
        <ul>
          <li>The item does not power on or stops working within the warranty period.</li>
          <li>The box arrived crushed, sealed wrongly or missing an accessory.</li>
          <li>You received a different model, colour or quantity than ordered.</li>
        </ul>

        <h2>What does not qualify</h2>
        <ul>
          <li>Change of mind after the product has been used.</li>
          <li>Physical or liquid damage caused after delivery.</li>
          <li>Units opened or repaired outside our service desk.</li>
          <li>Missing box, manual or accessories when returning.</li>
          <li>
            Hygiene-sensitive items such as in-ear tips once the seal is broken,
            unless the item is defective.
          </li>
        </ul>

        <h2>How to start a return</h2>
        <ol>
          <li>
            Call {storeSite.hotline} or message us with your ORD- reference and a photo or
            short video of the problem.
          </li>
          <li>
            We confirm whether it is a replacement or a refund, usually the same day.
          </li>
          <li>
            Pack the item with all accessories and the original box. Our courier
            collects it, or you can drop it at the showroom.
          </li>
          <li>
            Once the item reaches our desk we test it and dispatch the replacement,
            normally within two working days.
          </li>
        </ol>

        <h2>Refund timing</h2>
        <ul>
          <li>
            <strong>Mobile wallet:</strong> sent back to the same number within three
            to five working days.
          </li>
          <li>
            <strong>Card:</strong> processed within five working days; your bank may
            take a further week to show it.
          </li>
          <li>
            <strong>Cash on delivery:</strong> refunded by mobile wallet to the number
            that placed the order.
          </li>
        </ul>

        <h2>Who pays the return delivery</h2>
        <p>
          If the fault is ours — defective, damaged or wrong item — we pay. If the
          product turns out to work correctly and the return was a change of mind,
          the delivery charge is deducted from the refund.
        </p>

        <p>
          Still unsure? Read the{" "}
          <Link href="/faq">frequently asked questions</Link> or{" "}
          <Link href="/contact-us">contact support</Link>.
        </p>
      </Prose>
    </>
  );
}
