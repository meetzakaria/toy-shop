import Link from "next/link";
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  Pin,
  WhatsApp,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import { getCategories } from "@/lib/rootcart/catalog";
import { getSite } from "@/lib/rootcart/site";
import { helpLinks, usefulLinks } from "@/lib/site";

const paymentMethods = ["bKash", "Nagad", "Rocket", "Visa", "Mastercard", "COD"];

export async function Footer() {
  const [categories, storeSite] = await Promise.all([getCategories(), getSite()]);

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-ink">{storeSite.description}</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Hotline 24/7:{" "}
                <a href={storeSite.hotlineHref} className="font-semibold hover:text-primary">
                  {storeSite.hotline}
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <Pin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{storeSite.address}</span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <a href={`mailto:${storeSite.email}`} className="hover:text-primary">
                {storeSite.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide">Useful Links</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {usefulLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink transition hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide">Help Center</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {helpLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink transition hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-7 text-sm font-bold uppercase tracking-wide">
            Shop by Category
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 4).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="text-ink transition hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide">
            {storeSite.name} Social Media
          </h2>
          <p className="mt-4 text-sm text-ink">
            Follow us on social media to stay updated with our latest offers.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={storeSite.social.facebook}
              aria-label="Facebook"
              rel="noopener noreferrer"
              target="_blank"
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-primary hover:text-primary"
            >
              <Facebook className="h-4.5 w-4.5" aria-hidden="true" />
            </a>
            <a
              href={storeSite.social.instagram}
              aria-label="Instagram"
              rel="noopener noreferrer"
              target="_blank"
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4.5 w-4.5" aria-hidden="true" />
            </a>
            <a
              href={storeSite.social.whatsapp}
              aria-label="WhatsApp"
              rel="noopener noreferrer"
              target="_blank"
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-primary hover:text-primary"
            >
              <WhatsApp className="h-4.5 w-4.5" aria-hidden="true" />
            </a>
          </div>

          <h2 className="mt-7 text-sm font-bold uppercase tracking-wide">
            We Accept
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <li
                key={method}
                className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {storeSite.legalName}. All rights reserved.
          </p>
          <p>
            Built with Next.js — prices include VAT where applicable.
          </p>
        </div>
      </div>
    </footer>
  );
}
