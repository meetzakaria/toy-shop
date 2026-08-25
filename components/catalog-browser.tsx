"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Close } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { swatchColor } from "@/components/product-art";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "newest", label: "Newest" },
] as const;

type Sort = (typeof sortOptions)[number]["value"];

const PAGE_SIZE = 12;

export function CatalogBrowser({
  products,
  columns = 4,
}: {
  products: Product[];
  columns?: 3 | 4;
}) {
  const bounds = useMemo(() => {
    const prices = products.map((p) => p.price);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };
  }, [products]);

  const colorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) =>
      product.colors.forEach((color) =>
        counts.set(color, (counts.get(color) ?? 0) + 1),
      ),
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [products]);

  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) =>
      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1),
    );
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const [maxPrice, setMaxPrice] = useState(bounds.max);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("relevance");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggle = (
    value: string,
    list: string[],
    setter: (next: string[]) => void,
  ) => {
    setter(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
    setPage(1);
  };

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      if (inStockOnly && !product.inStock) return false;
      if (product.price > maxPrice) return false;
      if (
        selectedColors.length &&
        !product.colors.some((color) => selectedColors.includes(color))
      )
        return false;
      if (selectedBrands.length && !selectedBrands.includes(product.brand))
        return false;
      return true;
    });

    switch (sort) {
      case "popular":
        return result.sort((a, b) => b.reviews - a.reviews);
      case "price-asc":
        return result.sort((a, b) => a.price - b.price);
      case "price-desc":
        return result.sort((a, b) => b.price - a.price);
      case "name-asc":
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return result.sort((a, b) => b.name.localeCompare(a.name));
      case "newest":
        return result.sort((a, b) => Number(b.badge === "New") - Number(a.badge === "New"));
      default:
        return result;
    }
  }, [products, inStockOnly, maxPrice, selectedColors, selectedBrands, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const activeFilterCount =
    selectedColors.length +
    selectedBrands.length +
    (inStockOnly ? 1 : 0) +
    (maxPrice < bounds.max ? 1 : 0);

  const resetFilters = () => {
    setSelectedColors([]);
    setSelectedBrands([]);
    setInStockOnly(false);
    setMaxPrice(bounds.max);
    setPage(1);
  };

  const filterPanel = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-bold">Availability</h3>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => {
              setInStockOnly(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-[var(--primary-color)]"
          />
          In stock only
        </label>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold">Price range</h3>
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={10}
          value={maxPrice}
          onChange={(event) => {
            setMaxPrice(Number(event.target.value));
            setPage(1);
          }}
          aria-label="Maximum price"
          className="w-full accent-[var(--primary-color)]"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>{formatPrice(bounds.min)}</span>
          <span className="font-semibold text-ink">up to {formatPrice(maxPrice)}</span>
        </div>
      </div>

      {colorOptions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold">Colour</h3>
          <ul className="space-y-2">
            {colorOptions.map(([color, count]) => (
              <li key={color}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedColors.includes(color)}
                    onChange={() =>
                      toggle(color, selectedColors, setSelectedColors)
                    }
                    className="h-4 w-4 accent-[var(--primary-color)]"
                  />
                  <span
                    className="h-4 w-4 rounded-full border border-line"
                    style={{ backgroundColor: swatchColor(color) }}
                    aria-hidden="true"
                  />
                  {color}
                  <span className="ml-auto text-xs text-muted">{count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brandOptions.length > 1 && (
        <div>
          <h3 className="mb-3 text-sm font-bold">Brand</h3>
          <ul className="space-y-2">
            {brandOptions.map(([brand, count]) => (
              <li key={brand}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() =>
                      toggle(brand, selectedBrands, setSelectedBrands)
                    }
                    className="h-4 w-4 accent-[var(--primary-color)]"
                  />
                  {brand}
                  <span className="ml-auto text-xs text-muted">{count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full rounded-lg border border-line py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-44 rounded-xl border border-line p-5">
          {filterPanel}
        </div>
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Showing <span className="font-semibold text-ink">{visible.length}</span>{" "}
            of <span className="font-semibold text-ink">{filtered.length}</span>{" "}
            products
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium lg:hidden"
            >
              Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
            <label className="relative flex items-center">
              <span className="sr-only">Sort products</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as Sort);
                  setPage(1);
                }}
                className="appearance-none rounded-lg border border-line bg-white py-2 pl-3 pr-9 text-sm outline-none focus:border-primary"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-16 text-center">
            <p className="font-semibold">No products match these filters.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ProductGrid products={visible} columns={columns} />
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-8 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/50"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-bold">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line"
              >
                <Close className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filterPanel}</div>
            <div className="border-t border-line p-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white"
              >
                Show {filtered.length} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
