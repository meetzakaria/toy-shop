"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight } from "@/components/icons";
import { ProductMedia } from "@/components/product-art";
import { clamp01, mix, useStickyProgress } from "@/components/motion";
import { discountPercent } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

/** More than six and the arc gets crowded before it gets impressive. */
const MAX_ITEMS = 6;

/**
 * A pinned shelf where the products travel along an arc as you scroll.
 *
 * Each card sits on the top of a very large circle, so moving sideways also
 * moves it slightly down and turns it by the tangent angle — the rotation is
 * a consequence of the path rather than an effect bolted on, which is why it
 * reads as physical. The card nearest the centre is scaled up and named in
 * the panel underneath, so the section is still doing a storefront's job:
 * putting one product in front of you at a time, with a price and a link.
 *
 * Everything moves by direct style writes inside the shared scroll frame.
 * React re-renders only when the centre product changes, six times at most.
 */
export function ShowcaseArc({
  products,
  eyebrow = "Handpicked",
  title = "The shelf, turning",
}: {
  products: Product[];
  eyebrow?: string;
  title?: string;
}) {
  const items = products.slice(0, MAX_ITEMS);
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(0);
  const geometry = useRef({ spacing: 260, radius: 1200 });
  const [active, setActive] = useState(0);

  const setCardRef = useCallback((index: number, el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  }, []);

  // The arc widens with the stage. Measured on resize rather than per frame,
  // so a frame never has to touch layout.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const read = () => {
      const width = stage.clientWidth || 1024;
      const spacing = Math.min(340, Math.max(148, width * 0.23));
      geometry.current = { spacing, radius: spacing * 4.8 };
    };
    read();

    if (!("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(read);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useStickyProgress(trackRef, stageRef, (p) => {
    const { spacing, radius } = geometry.current;
    // Where along the row of cards the centre of the stage currently is.
    const position = p * Math.max(1, items.length - 1);

    if (ringRef.current) {
      ringRef.current.style.transform = `rotate(${(p * 88 - 44).toFixed(2)}deg)`;
    }

    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < items.length; i++) {
      const el = cardRefs.current[i];
      const offset = i - position;
      const distance = Math.abs(offset);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = i;
      }
      if (!el) continue;

      const along = offset * spacing;
      const angle = along / radius;
      const x = radius * Math.sin(angle);
      const dip = radius * (1 - Math.cos(angle));
      const scale = mix(1.06, 0.78, clamp01(distance / 2.2));
      const fade = 1 - clamp01((distance - 1.5) / 1.1);

      el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), ${dip.toFixed(1)}px, 0) rotate(${((angle * 180) / Math.PI).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      el.style.opacity = fade.toFixed(3);
      el.style.zIndex = String(200 - Math.round(distance * 20));
      // Only the card in front should be clickable; the rest are scenery.
      el.style.pointerEvents = distance < 0.5 ? "auto" : "none";
    }

    if (activeRef.current !== nearest) {
      activeRef.current = nearest;
      setActive(nearest);
    }
  });

  // Two cards cannot form an arc worth pinning the page for.
  if (items.length < 3) return null;

  const current = items[Math.min(active, items.length - 1)];
  const discount = discountPercent(current);

  return (
    <section
      ref={trackRef}
      aria-label={title}
      className="arc-track relative"
      style={{ "--steps": items.length - 1 } as CSSProperties}
    >
      <div
        ref={stageRef}
        className="arc-stage sticky top-0 flex flex-col justify-center overflow-hidden bg-surface"
      >
        {/* A dashed ring that turns with the scroll, hinting at the path */}
        <div
          ref={ringRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[58%] aspect-square w-[190%] -translate-x-1/2 rounded-full border-2 border-dashed border-primary/15 sm:w-[130%]"
          style={{ willChange: "transform" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white to-transparent"
        />

        <div className="container-page relative">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
            <h2 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">
              {title}
            </h2>
          </div>

          {/* The arc itself. Cards are absolutely placed and moved by the
              scroll frame; the wrapper only reserves their height. */}
          <div className="relative mx-auto mt-6 h-[clamp(10.5rem,26vmin,17rem)] sm:mt-10">
            {items.map((product, i) => (
              <div
                key={product.slug}
                ref={(el) => setCardRef(i, el)}
                className="absolute left-1/2 top-0 w-[clamp(8rem,19vmin,13rem)]"
                style={{ willChange: "transform, opacity" }}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="block overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:border-primary/60 hover:shadow-lg"
                  tabIndex={i === active ? 0 : -1}
                >
                  <ProductMedia
                    slug={product.slug}
                    category={product.category}
                    name={product.name}
                    image={product.image}
                    color={product.colors[0]}
                    className="aspect-square w-full bg-surface"
                  />
                </Link>
              </div>
            ))}
          </div>

          {/* One product in front at a time, named and priced */}
          <div key={current.slug} className="animate-fade-up mt-6 text-center sm:mt-9">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {current.brand} · {current.categoryName}
            </p>
            <p className="mt-1 text-base font-bold leading-snug sm:text-lg">
              {current.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-lg font-extrabold text-primary sm:text-xl">
                {formatPrice(current.price)}
              </span>
              {current.oldPrice && (
                <span className="text-sm text-muted line-through">
                  {formatPrice(current.oldPrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="rounded-md bg-danger px-2 py-0.5 text-[11px] font-bold text-white">
                  -{discount}%
                </span>
              )}
            </div>
            <Link
              href={`/products/${current.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              View product
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ol className="mt-5 flex items-center justify-center gap-2 sm:mt-7" aria-hidden="true">
            {items.map((product, i) => (
              <li
                key={product.slug}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === active ? "w-7 bg-primary" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </ol>

          <p className="mt-4 text-center text-xs text-muted sm:mt-6">
            Keep scrolling — the shelf turns as you go
          </p>
        </div>
      </div>
    </section>
  );
}
