import { getStoreConfig } from "@/lib/rootcart/catalog";
import { defaultShipping, site } from "@/lib/site";
import type { StoreBrand } from "@/lib/store-context";

/**
 * The store's identity, with what the seller maintains in RootCart layered over the template's
 * defaults.
 *
 * <p>Server-only: it awaits. Client components read the same values out of the store context, which
 * the root layout fills from here.</p>
 *
 * <p>Blank is treated as absent throughout. A seller who has not filled in an address should see the
 * template's placeholder rather than an empty line in the footer, so every field falls back
 * individually instead of the whole object falling back together.</p>
 */

export type ShippingZone = { name: string; rate: number };

export type SiteInfo = {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  url: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  hotline: string;
  hotlineHref: string;
  email: string;
  address: string;
  hours: string;
  social: typeof site.social;
  logoUrl?: string;
  paymentMethods: string[];
  shippingZones: ShippingZone[];
  /** True when the values came from RootCart rather than the template's defaults. */
  connected: boolean;
};

function firstNonBlank(...values: (string | null | undefined)[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}

export async function getSite(): Promise<SiteInfo> {
  const config = await getStoreConfig();

  const zones: ShippingZone[] = (config?.commerce?.shippingZones ?? [])
    .filter((zone): zone is { name: string; rate?: number } => Boolean(zone?.name))
    .map((zone) => ({ name: zone.name, rate: Number(zone.rate ?? 0) }));

  return {
    name: firstNonBlank(config?.store?.name) ?? site.name,
    legalName: firstNonBlank(config?.store?.name) ?? site.legalName,
    tagline: firstNonBlank(config?.theme?.heroHeadline) ?? site.tagline,
    description:
      firstNonBlank(config?.branding?.aboutDescription, config?.theme?.heroSubheadline) ??
      site.description,
    // Never taken from the API: metadataBase must be this deployment's own origin, which only the
    // deployment knows. A store's RootCart subdomain is a different site.
    url: site.url,
    currency: firstNonBlank(config?.commerce?.currency) ?? site.currency,
    currencySymbol: site.currencySymbol,
    locale: site.locale,
    hotline: firstNonBlank(config?.branding?.contactPhone) ?? site.hotline,
    hotlineHref: `tel:${(firstNonBlank(config?.branding?.contactPhone) ?? site.hotline).replace(/[^\d+]/g, "")}`,
    email: firstNonBlank(config?.branding?.contactEmail) ?? site.email,
    address: firstNonBlank(config?.branding?.address) ?? site.address,
    hours: site.hours,
    social: site.social,
    logoUrl: firstNonBlank(config?.branding?.logoUrl),
    paymentMethods: config?.commerce?.paymentMethods ?? [],
    shippingZones: zones.length > 0 ? zones : [...defaultShipping.zones],
    connected: config !== null,
  };
}

/** The subset client components need, for the store context. */
export async function getStoreBrand(): Promise<StoreBrand> {
  const info = await getSite();
  return {
    name: info.name,
    tagline: info.tagline,
    description: info.description,
    logoUrl: info.logoUrl,
    contactEmail: info.email,
    contactPhone: info.hotline,
    address: info.address,
    currency: info.currency,
    paymentMethods: info.paymentMethods,
  };
}
