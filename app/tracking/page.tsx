import type { Metadata } from "next";
import { PageHeader } from "@/components/section";
import { TrackingView } from "@/components/tracking-view";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Look up an order you placed on this device.",
};

/**
 * `?order=` is read here and passed down, rather than with useSearchParams inside the client view —
 * a client component reading search params in a statically rendered route fails the production build
 * unless it is wrapped in Suspense.
 */
export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  const initial = Array.isArray(order) ? order[0] : order;

  return (
    <>
      <PageHeader
        title="Track Your Order"
        description="Enter the order reference from your confirmation to see its details."
        breadcrumb={[{ label: "Order Tracking" }]}
      />
      <TrackingView initialReference={initial ?? ""} />
    </>
  );
}
