"use client";

import { useId, useState } from "react";
import { categoryIcons } from "@/components/icons";
import { useCategoryBySlug } from "@/lib/store-context";

/** Deterministic 0..1 hash so every product gets a stable, unique-looking tile. */
function hash(seed: string) {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) {
    value = (value * 31 + seed.charCodeAt(i)) % 100000;
  }
  return value;
}

const colorSwatches: Record<string, string> = {
  Black: "#1f2937",
  White: "#f4f5f2",
  Gray: "#9ca3af",
  Gold: "#d4af37",
  Purple: "#8b5cf6",
  Pink: "#ec4899",
  Blue: "#2563eb",
  Green: "#659900",
  Beige: "#e7dcc5",
};

/**
 * Best-effort hex for a variant label.
 *
 * <p>RootCart variants carry only a free-text name, so a seller may type "Blue", "Midnight" or
 * "1 kg". Known colour words get their colour; anything else gets a neutral, which is honest — the
 * swatch is then a labelled button rather than a wrong colour.</p>
 */
export function swatchColor(name: string) {
  return colorSwatches[name] ?? "#cbd5e1";
}

/**
 * A product's picture: the seller's photo when there is one, generated art when there is not.
 *
 * <p>The fallback is not only for products with no upload. RootCart returns an image URL whether or
 * not a file sits behind it, so a load failure is an expected outcome and switches to the art rather
 * than leaving a broken-image icon on the shelf.</p>
 */
export function ProductMedia({
  slug,
  category,
  name,
  image,
  color,
  className = "",
}: {
  slug: string;
  category: string;
  name?: string;
  image?: string;
  color?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (image && !failed) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* A plain img, not next/image: the host is the seller's API and is not in the Next image
            allowlist, and adding it would put every product photo through our own optimiser. */}
        <img
          src={image}
          alt={name ? `${name}` : "Product"}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return <ProductArt slug={slug} category={category} name={name} color={color} className={className} />;
}

/**
 * Product imagery generated locally: a tinted studio backdrop, a soft
 * shadow and the category glyph. No remote asset host, no layout shift.
 */
export function ProductArt({
  slug,
  category,
  name,
  color,
  className = "",
}: {
  slug: string;
  category: string;
  name?: string;
  color?: string;
  className?: string;
}) {
  const cat = useCategoryBySlug(category);
  const Glyph = categoryIcons[cat?.icon ?? "cable"];
  const seed = hash(slug);
  const rotation = (seed % 14) - 7;
  const tint = color ? swatchColor(color) : (cat?.hue ?? "#659900");
  // Was `bg-${slug}`, which collided whenever the same product appeared twice on a page — the hero
  // main panel and a side card do exactly that — and the second instance inherited the first's fill.
  const gradientId = `bg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label={name ? `${name} illustration` : `${cat?.name ?? "Product"} illustration`}
        className="h-full w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f6f7f3" />
            <stop offset="100%" stopColor={`${tint}22`} />
          </linearGradient>
          <radialGradient id={`${gradientId}-glow`} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={tint} stopOpacity="0.28" />
            <stop offset="100%" stopColor={tint} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill={`url(#${gradientId})`} />
        <circle cx="200" cy="180" r="130" fill={`url(#${gradientId}-glow)`} />
        <ellipse cx="200" cy="318" rx="104" ry="18" fill={tint} opacity="0.14" />
        <g
          transform={`translate(200 190) rotate(${rotation}) translate(-200 -190)`}
        >
          <rect
            x="118"
            y="108"
            width="164"
            height="164"
            rx="42"
            fill="#ffffff"
            stroke={tint}
            strokeOpacity="0.28"
            strokeWidth="2"
          />
          <g transform="translate(148 138) scale(4.33)" color={tint}>
            <Glyph width={24} height={24} strokeWidth={1.3} />
          </g>
        </g>
      </svg>
    </div>
  );
}
