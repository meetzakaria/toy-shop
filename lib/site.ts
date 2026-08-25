/**
 * Template-local defaults.
 *
 * <p>These are the values the storefront falls back to, and the ones that must stay synchronous
 * because client components read them during render — `formatPrice` reaches for `currencySymbol` at
 * forty call sites, none of which can await.</p>
 *
 * <p>Anything the seller maintains in RootCart — store name, tagline, contact details, address,
 * delivery zones — is overlaid on top by {@link import("@/lib/rootcart/site").getSite} on the server,
 * and reaches client components through the store context. Editing this file changes only the
 * fallback a store shows before its config has loaded, or when a field is blank in the dashboard.</p>
 */
export const site = {
  name: "Gadgetly",
  legalName: "Gadgetly BD",
  tagline: "Shop Smarter, Live Better.",
  description:
    "Discover top-quality gadgets, accessories and everyday tech at Gadgetly. Elevate your tech lifestyle with us. Shop now!",
  /** Absolute, and used for `metadataBase` — a blank or relative value throws at import time. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://gadgetly.example",
  currency: "BDT",
  currencySymbol: "৳",
  locale: "en_US",
  hotline: "01700-000000",
  hotlineHref: "tel:01700000000",
  email: "support@gadgetly.example",
  address:
    "Level 2, House 14, Road 7, Dhanmondi, Dhaka - 1205, Bangladesh",
  hours: "Saturday – Thursday, 10:00 AM – 8:00 PM",
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    whatsapp: "https://wa.me/8801700000000",
    messenger: "https://m.me/",
    youtube: "https://youtube.com/",
  },
} as const;

/**
 * Delivery copy shown before the store's own zones load, and when the seller has defined none.
 *
 * <p>Deliberately no longer used to CHARGE anything. Delivery is priced by RootCart from the buyer's
 * address, so a locally-computed fee was a second, disagreeing answer: the cart showed one number and
 * the order was created with another. These are captions now, and the real zones replace them
 * wherever the store config has loaded.</p>
 */
export const defaultShipping = {
  zones: [
    { name: "Inside Dhaka", rate: 70 },
    { name: "Outside Dhaka", rate: 130 },
  ],
} as const;

export const usefulLinks = [
  { label: "About Us", href: "/about-us" },
  { label: "Collections", href: "/collections" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-and-condition" },
  { label: "Return and Refund", href: "/return-and-refund" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

export const helpLinks = [
  { label: "Order Tracking", href: "/tracking" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "How to Order", href: "/how-to-order" },
  { label: "Product Returns", href: "/return-and-refund" },
  { label: "FAQ", href: "/faq" },
];
