"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "@/components/icons";
import { Parallax } from "@/components/motion";
import { ProductMedia } from "@/components/product-art";
import { formatPrice } from "@/lib/format";

export type Slide = {
  eyebrow: string;
  title: string;
  copy: string;
  price?: number;
  discount?: number;
  href: string;
  slug: string;
  category: string;
  tint: string;
  /**
   * The seller's own photograph, when they have uploaded one.
   *
   * <p>Optional because a store can have products with no image yet, and the hero is the last place
   * that should render a broken frame — {@link ProductMedia} falls back to the generated art, which
   * is what every slide showed before this field existed.</p>
   */
  image?: string;
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(
    // Guarded: with no slides this was `% 0`, which is NaN, and the index never recovered.
    () => setIndex((current) => (slides.length === 0 ? 0 : (current + 1) % slides.length)),
    [slides.length],
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(next, 6000);
    return () => window.clearInterval(timer);
  }, [next, slides.length]);

  // A store with nothing featured yet renders no hero rather than crashing on slides[0].tint.
  if (slides.length === 0) return null;

  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <section
      aria-label="Featured offers"
      className="container-page pt-5"
    >
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div
          className="relative overflow-hidden rounded-2xl border border-line"
          style={{
            background: `linear-gradient(120deg, ${slide.tint}1f 0%, #ffffff 55%, ${slide.tint}12 100%)`,
          }}
        >
          <div className="grid items-center gap-4 p-6 sm:grid-cols-2 sm:p-9">
            <div className="animate-fade-up" key={slide.title}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {slide.eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                {slide.title}
              </h1>
              <p className="mt-3 max-w-md text-sm text-ink">{slide.copy}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {slide.price !== undefined && (
                  <span className="text-2xl font-extrabold text-primary">
                    {formatPrice(slide.price)}
                  </span>
                )}
                {slide.discount !== undefined && (
                  <span className="rounded-md bg-danger px-2 py-1 text-xs font-bold text-white">
                    {slide.discount}% OFF
                  </span>
                )}
              </div>
              <Link
                href={slide.href}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:gap-3 hover:bg-primary-dark"
              >
                Shop Now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            {/* Centre-relative, so the art sits square on load and only
                leans once the hero starts leaving the screen. */}
            <Parallax
              speed={0.07}
              rotate={7}
              scale={0.05}
              className="mx-auto w-full max-w-xs"
            >
              <ProductMedia
                slug={slide.slug}
                category={slide.category}
                name={slide.title}
                image={slide.image}
                className="aspect-square w-full"
              />
            </Parallax>
          </div>

          <div className="absolute bottom-4 left-6 flex gap-1.5 sm:left-9">
            {slides.map((item, dot) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setIndex(dot)}
                aria-label={`Go to slide ${dot + 1}`}
                aria-current={dot === index}
                className={`h-1.5 rounded-full transition-all ${
                  dot === index ? "w-7 bg-primary" : "w-3 bg-line"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {slides.slice(0, 2).map((item) => (
            <Link
              key={`side-${item.title}`}
              href={item.href}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line p-5 transition hover:border-primary/50"
              style={{ background: `linear-gradient(135deg, ${item.tint}16, #ffffff)` }}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                  {item.eyebrow}
                </p>
                <p className="mt-1 line-clamp-2-fallback text-sm font-semibold">
                  {item.title}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  Shop Now
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
              <ProductMedia
                slug={item.slug}
                category={item.category}
                name={item.title}
                image={item.image}
                className="ml-auto h-24 w-24 shrink-0 rounded-xl"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
