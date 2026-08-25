"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useBrand, useCategories } from "@/lib/store-context";
import { categoryIcons } from "@/components/icons";
import {
  CartIcon,
  ChevronDown,
  ChevronRight,
  Close,
  Menu,
  Phone,
  Truck,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

const announcements = [
  "Delivery charge shown at checkout, before you confirm",
  "Cash on delivery available all over Bangladesh",
  "7 days easy replacement on every product",
  "Same day dispatch for orders placed before 4 PM",
];

export function Header() {
  const { count, subtotal, openDrawer } = useCart();
  const categories = useCategories();
  const brand = useBrand();
  // The store's own number when its config has loaded, the template's placeholder before that.
  const hotline = brand?.contactPhone ?? site.hotline;
  const hotlineHref = `tel:${hotline.replace(/[^\d+]/g, "")}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const pathname = usePathname();

  // Panels close from the click that navigates, so no pathname effect is needed.
  const closePanels = () => {
    setMenuOpen(false);
    setCategoriesOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <div className="overflow-hidden bg-primary text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-xs">
          <div className="flex min-w-0 flex-1 overflow-hidden">
            <div className="flex w-max animate-marquee gap-10 whitespace-nowrap sm:animate-none">
              {[...announcements, ...announcements].map((line, index) => (
                <span key={`${line}-${index}`} className="sm:first:block sm:hidden sm:[&:nth-child(1)]:block">
                  {line}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            <a href={hotlineHref} className="flex items-center gap-1.5 hover:underline">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {hotline}
            </a>
            <Link href="/tracking" className="flex items-center gap-1.5 hover:underline">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Track Order
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <Logo />

        <div className="hidden flex-1 lg:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          <Link
            href="/tracking"
            className="hidden items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary md:flex"
          >
            <Truck className="h-4 w-4" aria-hidden="true" />
            Track
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            className="flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-white transition hover:bg-primary-dark"
            aria-label={`Open cart, ${count} items`}
          >
            <span className="relative">
              <CartIcon className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
                {count}
              </span>
            </span>
            <span className="hidden text-left text-xs leading-tight sm:block">
              <span className="block opacity-80">Your Cart</span>
              <span className="block font-semibold">{formatPrice(subtotal)}</span>
            </span>
          </button>
        </div>
      </div>

      <div className="border-t border-line px-0 pb-3 lg:hidden">
        <div className="container-page pt-3">
          <SearchBox />
        </div>
      </div>

      <nav className="hidden border-t border-line bg-white lg:block">
        <div className="container-page flex items-center gap-1">
          <div
            className="relative"
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              aria-expanded={categoriesOpen}
              className="my-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
              All Categories
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            {categoriesOpen && (
              <div
                onClick={closePanels}
                className="absolute left-0 top-full z-50 w-72 rounded-xl border border-line bg-white p-2 shadow-xl"
              >
                {categories.map((category) => {
                  const Icon = categoryIcons[category.icon];
                  return (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-primary-soft hover:text-primary-dark"
                    >
                      <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                      {category.name}
                      <ChevronRight className="ml-auto h-4 w-4 text-muted" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <ul className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition hover:text-primary ${
                    pathname === `/category/${category.slug}`
                      ? "text-primary"
                      : "text-ink"
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/tracking"
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:underline"
          >
            <Truck className="h-4 w-4" aria-hidden="true" />
            Track Order
          </Link>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line"
              >
                <Close className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div onClick={closePanels} className="flex-1 overflow-y-auto px-4 py-4">
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Browse Categories
              </p>
              <ul className="space-y-1">
                {categories.map((category) => {
                  const Icon = categoryIcons[category.icon];
                  return (
                    <li key={category.slug}>
                      <Link
                        href={`/category/${category.slug}`}
                        className="flex items-center gap-3 rounded-lg border border-line px-3 py-3 text-sm font-medium"
                      >
                        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                        {category.name}
                        <ChevronRight className="ml-auto h-4 w-4 text-muted" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <p className="px-1 pb-2 pt-6 text-xs font-semibold uppercase tracking-wide text-muted">
                Quick Links
              </p>
              <ul className="space-y-1 text-sm">
                {[
                  { label: "All Collections", href: "/collections" },
                  { label: "Track Order", href: "/tracking" },
                  { label: "How to Order", href: "/how-to-order" },
                  { label: "Contact Us", href: "/contact-us" },
                  { label: "FAQ", href: "/faq" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="block rounded-lg px-3 py-2.5">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-line px-4 py-4 text-sm">
              <a
                href={hotlineHref}
                className="flex items-center gap-2 font-semibold text-primary"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {hotline}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
