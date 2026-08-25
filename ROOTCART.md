# Connected to RootCart

This storefront has no catalogue of its own. Products, prices, stock, the cart and orders all live in
RootCart; this app only decides how they look.

---

## 1. Point it at your store

Create a **publishable** key in the RootCart dashboard — Settings → Developers → New key — and add
this site's origin to its allowed-origins list. Then fill in `.env.local`:

```
NEXT_PUBLIC_ROOTCART_API=https://api.rootcart.shop/api/v1/storefront
NEXT_PUBLIC_ROOTCART_KEY=rc_pk_...
NEXT_PUBLIC_SITE_URL=https://yourshop.com
```

Restart `next dev` after changing these — Next reads env files at startup.

> Only a **publishable** key (`rc_pk_`) belongs here. Anything `NEXT_PUBLIC_` is readable by every
> visitor. A secret key (`rc_sk_`) would be a leak, and the API refuses one that arrives from a
> browser anyway.

**On the RootCart side**, set `APP_STOREFRONT_API_PUBLIC_BASE_URL` on the backend. Without it the API
returns relative image URLs, which resolve against *this* site and 404.

---

## 2. Custom fields this template reads

RootCart models what every shop has. Everything else is a custom field the seller defines in
**Content → Custom fields**, under the `shop` namespace. All are optional — the site renders without
them, just with less on the page.

| Field | Attach to | Type | Shows up as |
|---|---|---|---|
| `shop.brand` | product | string | The line above the product title |
| `shop.old_price` | product | number | Struck-through price and the discount badge |
| `shop.warranty` | product | string | Warranty row on the product page |
| `shop.highlights` | product | json | Bullet list — `["…","…"]` |
| `shop.specs` | product | json | Spec table — `[["Driver","11 mm"],…]` |
| `shop.badge` | product | string | Corner ribbon. Any text |
| `shop.icon` | category | string | Category glyph — see below |
| `shop.hue` | category | string | 6-digit hex tint, e.g. `#659900` |
| `shop.blurb` | category | text | One line under the category name |

**Icon names**, and only these: `headphones` · `cable` · `bolt` · `keyboard` · `watch` · `tv` ·
`car` · `fan`. Anything else falls back to a glyph picked from the slug, so it stays stable but is
not your choice. Add new ones in `components/icons.tsx` and `lib/types.ts`.

**Hue must be 6-digit hex.** The generated art composites transparency by appending hex digits, so
`red` or `rgb(…)` produces invalid CSS and the tile loses its colour. Three-digit hex is expanded;
anything else falls back to a palette colour.

---

## 3. Collections drive the home page

Create these in **Content → Collections**. Each is optional; a missing one falls back to a slice of
the catalogue, so a new store still looks full.

| Handle | Section |
|---|---|
| `featured` | The hero slider |
| `deals` | "Deals running now" |
| `best-sellers` | "Best sellers" |
| `new-arrivals` | "New arrivals" — hidden entirely unless you create it |

Editing a collection's rules changes the shelf. Nobody redeploys this site.

---

## 4. Variants are the option picker

A product's variants become its swatches, labelled with whatever the seller typed — "Black", "1 kg",
"Blue / L". A variant with tracked stock at zero renders disabled and cannot be added.

Two limits worth knowing:

- **No colour data.** A variant carries a name and nothing else, so a swatch's colour is guessed from
  the name against a small English list. "Midnight" or "রঙিন" renders neutral grey, and the label
  carries the meaning.
- **No per-variant photo.** RootCart stores one image per product, so picking a variant does not
  change the picture.

---

## 5. What the template does not do

- **Order tracking is limited to this device.** RootCart has no public order-lookup endpoint, and the
  scope that would read one is deliberately not browser-safe. `/tracking` shows the order placed in
  this browser and, for anything else, tells the buyer to call the shop. It does not invent a
  timeline — the previous version derived one from the length of the reference string.
- **No customer accounts.** Checkout is guest-only.
- **The order note** is appended to the delivery address, because RootCart has no note field.
- **Product images.** Where a product has no photo, the tile falls back to generated art — the same
  art the template has always used.

---

## 6. Where things live

| File | Does what |
|---|---|
| `lib/rootcart/env.ts` | Reads and validates the two env values |
| `lib/rootcart/api.ts` | The only place that calls RootCart. Server reads cache and tag; cart calls never do |
| `lib/rootcart/types.ts` | The wire shapes, kept separate from the display types |
| `lib/rootcart/map.ts` | Wire → display. The one file that knows both sides |
| `lib/rootcart/catalog.ts` | Products, categories, collections, content |
| `lib/rootcart/home.ts` | Assembles the home page, collection-first with fallbacks |
| `lib/rootcart/site.ts` | Store identity, RootCart over template defaults |
| `lib/store-context.tsx` | Categories and brand for client components |
| `lib/cart-context.tsx` | The cart, held by RootCart |

Catalogue reads revalidate every 60s, config every 300s, both tagged — so `revalidateTag('rootcart-catalog')`
pushes new prices without a redeploy.

---

## 7. Things that changed, and why

Worth knowing if you compare against the original template:

- **The cart is server-authoritative.** It was a localStorage array holding prices copied from a
  bundled catalogue, and the subtotal was summed in the browser — so editing one localStorage entry
  changed what the buyer paid. Lines are now references RootCart prices and stock-checks.
- **Delivery is quoted by the server.** The cart page assumed "inside Dhaka" while checkout charged
  the outside rate, and neither matched what an order would have cost. There is one number now, from
  the address the buyer typed.
- **Checkout creates an order.** It used to discard every field it collected, invent a reference and
  clear the cart. It now posts to RootCart with an `Idempotency-Key`, so a retried submit returns the
  original order instead of placing a second one — and the cart survives a failure.
- **Out-of-stock products cannot be added.** Nothing checked the flag before, and every seeded product
  hardcoded `inStock: true`.
- **Sections come from collections, not from a badge.** "New arrivals" was `badge === "New"`, so a
  seller typing "Just in" silently emptied the section.
