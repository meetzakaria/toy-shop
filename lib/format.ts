import { site } from "@/lib/site";

const numberFormat = new Intl.NumberFormat("en-US");

export function formatPrice(amount: number) {
  return `${site.currencySymbol}${numberFormat.format(Math.round(amount))}`;
}

export function formatNumber(amount: number) {
  return numberFormat.format(amount);
}

/**
 * `shippingFee` used to live here and is deliberately gone.
 *
 * It computed delivery from three local constants, which meant the page quoted one fee and RootCart
 * charged another — and the cart and checkout pages already disagreed with each other, one assuming
 * "inside Dhaka" and the other reading a zone selector. Delivery is now priced by the server from the
 * buyer's address and arrives on the cart totals, so there is one answer and it is the one the order
 * is created with.
 */
