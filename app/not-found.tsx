import Link from "next/link";
import { getCategories } from "@/lib/rootcart/catalog";

export default async function NotFound() {
  const categories = await getCategories();

  return (
    <div className="container-page py-24 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-3 text-2xl font-extrabold">This page does not exist</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        The link may be old, or the product may have been removed. Try a collection
        instead.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Back to home
        </Link>
        <Link
          href="/collections"
          className="rounded-full border border-line px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
        >
          All collections
        </Link>
      </div>
      <ul className="mt-10 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/category/${category.slug}`}
              className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-primary hover:text-primary"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
