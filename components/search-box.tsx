"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "@/components/icons";

export function SearchBox({
  placeholder = "Search for earbuds, chargers, fans…",
  defaultValue = "",
  className = "",
}: {
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
      }}
      className={`flex w-full items-center gap-2 rounded-full border border-line bg-white px-4 py-2 focus-within:border-primary ${className}`}
    >
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        className="hidden rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark sm:block"
      >
        Search
      </button>
    </form>
  );
}
