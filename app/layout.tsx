import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/cart-drawer";
import { FloatingActions } from "@/components/floating-actions";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/lib/cart-context";
import { getCategories } from "@/lib/rootcart/catalog";
import { getSite, getStoreBrand } from "@/lib/rootcart/site";
import { publishableCredentials } from "@/lib/rootcart/credentials";
import { StoreProvider } from "@/lib/store-context";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Titles and social cards carry the store's own name, so this had to stop being a static constant.
 *
 * <p>`metadataBase` stays a deployment value rather than a store value: it is the origin this site is
 * served from, which the store's RootCart record does not know. It comes from NEXT_PUBLIC_SITE_URL.</p>
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} | ${site.tagline}`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    openGraph: {
      title: `${site.name} | ${site.tagline}`,
      description: site.description,
      url: site.url,
      siteName: site.name,
      locale: site.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} | ${site.tagline}`,
      description: site.description,
    },
  };
}

/**
 * The layout is where store data enters the client tree.
 *
 * <p>Categories and brand details are fetched once here — a server component, which can await — and
 * handed to {@link StoreProvider}. Client components then read them synchronously during render,
 * which they must: the generated product art resolves a category's glyph and tint for every tile on
 * the page, and a client component can neither be async nor await at module scope.</p>
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [categories, brand] = await Promise.all([getCategories(), getStoreBrand()]);

  return (
    <html lang="en" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <StoreProvider
          categories={categories}
          brand={brand}
          credentials={publishableCredentials()}
        >
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <FloatingActions />
          </CartProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
