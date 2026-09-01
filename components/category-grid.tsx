import Link from "next/link";
import { categoryIcons } from "@/components/icons";
import { ScrollSpin } from "@/components/scroll-fx";
import { getCategories } from "@/lib/rootcart/catalog";

/**
 * The category tiles.
 *
 * <p>Fetches its own categories rather than taking them as a prop, so the six pages that render it
 * did not all have to grow a data-loading responsibility. Next memoises the underlying request per
 * render pass, so a page showing this alongside its own category read still makes one call.</p>
 *
 * <p>The item count comes with the category now. It used to be `productsByCategory(slug).length`
 * evaluated inside this map — eight catalogue scans to render eight numbers.</p>
 */
export async function CategoryGrid({ compact = false }: { compact?: boolean }) {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <div
      className={`grid gap-3 sm:gap-4 ${
        compact
          ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      }`}
    >
      {categories.map((category) => {
        // Falls back rather than indexing blind: a seller can name an icon this template has no
        // glyph for, and an undefined component crashes the whole grid.
        const Icon = categoryIcons[category.icon] ?? categoryIcons.cable;
        return (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-line bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <ScrollSpin turns={0.09} lift={5} scale={0.07}>
              <span
                className="grid h-14 w-14 place-items-center rounded-full transition group-hover:scale-105"
                style={{ backgroundColor: `${category.hue}1a`, color: category.hue }}
              >
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
            </ScrollSpin>
            <span className="text-sm font-semibold leading-snug">
              {category.name}
            </span>
            {!compact && category.blurb && (
              <span className="text-xs text-muted">{category.blurb}</span>
            )}
            <span className="text-xs text-muted">{category.productCount} items</span>
          </Link>
        );
      })}
    </div>
  );
}
