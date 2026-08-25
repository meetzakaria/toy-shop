import { Headset, Refresh, Shield, Truck } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { getSite } from "@/lib/rootcart/site";

/**
 * Perks are built inside the component, not at module scope.
 *
 * <p>They used to be a module-level constant interpolating a free-delivery threshold. That number no
 * longer exists — RootCart prices delivery by zone with no free-shipping rule — so advertising one
 * would promise something the checkout will not honour. The delivery line now quotes the store's own
 * cheapest zone, which is a claim the order can actually keep.</p>
 */
export async function TrustBar() {
  const site = await getSite();
  const cheapest = site.shippingZones.reduce<number | null>(
    (lowest, zone) => (lowest === null || zone.rate < lowest ? zone.rate : lowest),
    null,
  );

  const perks = [
    {
      icon: Truck,
      title: "Fast nationwide delivery",
      copy:
        cheapest === null
          ? "Delivery across the country, 1–3 days"
          : `Delivery from ${formatPrice(cheapest)}, 1–3 days countrywide`,
    },
    {
      icon: Refresh,
      title: "7 day easy replacement",
      copy: "Damaged or wrong item? We swap it, no argument",
    },
    {
      icon: Shield,
      title: "100% authentic stock",
      copy: "Imported and warranty-backed by our own service desk",
    },
    {
      icon: Headset,
      title: "Support that answers",
      copy: `Call ${site.hotline} — real people, seven days a week`,
    },
  ];

  return <TrustBarView perks={perks} />;
}

function TrustBarView({
  perks,
}: {
  perks: { icon: typeof Truck; title: string; copy: string }[];
}) {
  return (
    <section className="container-page py-8">
      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map((perk) => (
          <div key={perk.title} className="flex items-start gap-3 rounded-xl bg-white p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              <perk.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">{perk.title}</p>
              <p className="mt-0.5 text-xs text-muted">{perk.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
