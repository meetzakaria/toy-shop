import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/section";
import { formatPrice } from "@/lib/format";
import { getSite } from "@/lib/rootcart/site";

export async function generateMetadata(): Promise<Metadata> {
  const storeSite = await getSite();
  return {
    title: "Terms and Conditions",
    description: `The rules that apply when you buy from ${storeSite.name}.`,
  };
}

export default async function TermsPage() {
  const storeSite = await getSite();

  return (
    <>
      <PageHeader
        title="Terms and Conditions"
        description="The agreement between you and us when you place an order."
        breadcrumb={[{ label: "Terms and Conditions" }]}
      />
      <Prose>
        <p>
          By placing an order with {storeSite.legalName} you accept the terms below. Read
          them before you confirm an order; if something here does not work for you,
          call us before paying.
        </p>

        <h2>Orders</h2>
        <p>
          An order is a request, not a completed sale. It becomes binding once we
          confirm it by phone or SMS. We may decline an order if the item is out of
          stock, the address is outside our delivery network, or the contact number
          does not work.
        </p>

        <h2>Prices and payment</h2>
        <ul>
          <li>All prices are in Bangladeshi Taka and include VAT where applicable.</li>
          <li>
            Delivery is charged by zone
            {storeSite.shippingZones.length > 0 && (
              <>
                {" — "}
                {storeSite.shippingZones
                  .map((zone) => `${zone.name} ${formatPrice(zone.rate)}`)
                  .join(", ")}
              </>
            )}
            . The charge for your address is shown at checkout before you confirm.
          </li>
          <li>
            Prices can change without notice, but never after your order has been
            confirmed.
          </li>
          <li>
            If a price is listed wrongly due to a technical error, we will contact
            you and you may cancel without any charge.
          </li>
        </ul>

        <h2>Delivery</h2>
        <p>
          Delivery times are estimates, not guarantees. Weather, strikes and courier
          delays can add days. You are responsible for giving an address someone can
          actually find, and for being reachable on the number you provided. Two
          failed delivery attempts may cancel a cash-on-delivery order.
        </p>

        <h2>Inspection on delivery</h2>
        <p>
          Open the parcel in front of the rider. If the item is broken or the wrong
          model, refuse the delivery or call the hotline the same day. Claims about
          physical damage made after the rider leaves are difficult for us to verify.
        </p>

        <h2>Warranty</h2>
        <p>
          Warranty covers manufacturing defects only. It does not cover physical
          damage, water damage, burnt boards from unstable power, or units opened by
          a third-party repair shop. The warranty period for each product is stated
          on its product page.
        </p>

        <h2>Product information</h2>
        <p>
          We describe products as accurately as we can, but colours on screen and
          manufacturer specifications can differ slightly from the unit you receive.
          Illustrations on this site are representative.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Do not scrape, copy or resell content from this site, attempt to break its
          security, or place fake orders. We block numbers and addresses used for
          repeated fake orders.
        </p>

        <h2>Liability</h2>
        <p>
          Our liability for any order is limited to the amount you paid for it. We
          are not liable for indirect losses such as missed work or lost data.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${storeSite.email}`}>{storeSite.email}</a>{" "}
          or {storeSite.hotline}.
        </p>
      </Prose>
    </>
  );
}
