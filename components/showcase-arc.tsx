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
  const arcRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const geometry = useRef({ spacing: 260, radius: 1200 });
  // Where the track sits in the document and how much scrolling one card
  // costs. Read at the start of a gesture rather than every frame.
  const metrics = useRef({ trackTop: 0, stepPx: 1 });
  const draggedRef = useRef(false);
  const [active, setActive] = useState(0);

  const steps = Math.max(1, items.length - 1);

  /** Refresh the scroll geometry. One layout read, on demand. */
  const readMetrics = useCallback(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return metrics.current;
    const rect = track.getBoundingClientRect();
    const travel = Math.max(1, rect.height - stage.getBoundingClientRect().height);
    metrics.current = {
      trackTop: rect.top + window.scrollY,
      stepPx: travel / steps,
    };
    return metrics.current;
  }, [steps]);

  /** Bring one card to the front by scrolling the page to its position. */
  const goToIndex = useCallback(
    (index: number) => {
      const { trackTop, stepPx } = readMetrics();
      const clamped = Math.min(steps, Math.max(0, index));
      window.scrollTo({ top: trackTop + clamped * stepPx, behavior: "smooth" });
    },
    [readMetrics, steps],
  );

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

  /**
   * Drag the shelf sideways, with a mouse or a finger.
   *
   * The drag does not keep its own position — it scrolls the page, which is
   * the one thing the arc already follows. That keeps a dragged shelf and a
   * scrolled shelf in exactly the same state, and means letting go leaves
   * the page where the gesture left it instead of snapping back.
   *
   * `touch-action: pan-y` is what makes this coexist with reading: the
   * browser still owns vertical swipes, so a finger dragged up the cards
   * scrolls the page as usual, and only sideways movement reaches here.
   */
  useEffect(() => {
    const el = arcRef.current;
    if (!el) return;

    let pointerId: number | null = null;
    let axis: "x" | "y" | null = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let remainder = 0;

    const finish = () => {
      if (axis === "x") {
        const { trackTop, stepPx } = readMetrics();
        const here = (window.scrollY - trackTop) / stepPx;
        // A flick carries past the card it was on; a slow drag settles on
        // whichever card is nearest.
        const carry = ((-velocity * geometryStep()) / stepPx) * 220;
        goToIndex(Math.round(here + carry));
      }
      if (pointerId !== null && el.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
      pointerId = null;
      axis = null;
      velocity = 0;
      remainder = 0;
    };

    /** Scroll pixels per pixel of drag, so a card tracks the finger 1:1. */
    const geometryStep = () =>
      metrics.current.stepPx / geometry.current.spacing;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerId = event.pointerId;
      axis = null;
      draggedRef.current = false;
      startX = lastX = event.clientX;
      remainder = 0;
      startY = event.clientY;
      lastTime = event.timeStamp;
      velocity = 0;
      readMetrics();
    };

    const onMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;

      if (axis === null) {
        const dx = Math.abs(event.clientX - startX);
        const dy = Math.abs(event.clientY - startY);
        if (dx < 6 && dy < 6) return;
        // Vertical wins outright: that gesture belongs to the page.
        axis = dx > dy ? "x" : "y";
        if (axis === "x") el.setPointerCapture(event.pointerId);
      }
      if (axis !== "x") return;

      const dx = event.clientX - lastX;
      const dt = Math.max(1, event.timeStamp - lastTime);
      lastX = event.clientX;
      lastTime = event.timeStamp;
      velocity = dx / dt;
      draggedRef.current = true;

      // Dragging left moves the shelf forward, which is scrolling down.
      remainder += -dx * geometryStep();
      const whole = Math.trunc(remainder);
      if (whole !== 0) {
        remainder -= whole;
        window.scrollBy(0, whole);
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", finish);
    };
  }, [goToIndex, readMetrics]);

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
      // Only the front card is a link. The others let the pointer through
      // to the drag surface underneath, so a drag can start anywhere.
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
          <div
            ref={arcRef}
            onDragStart={(event) => event.preventDefault()}
            onClickCapture={(event) => {
              // A drag that ends on the front card must not also open it.
              if (!draggedRef.current) return;
              draggedRef.current = false;
              event.preventDefault();
              event.stopPropagation();
            }}
            className="relative mx-auto mt-6 h-[clamp(10.5rem,26vmin,17rem)] cursor-grab touch-pan-y select-none active:cursor-grabbing sm:mt-10"
          >
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

          <ol className="mt-5 flex items-center justify-center gap-2 sm:mt-7">
            {items.map((product, i) => (
              <li key={product.slug} className="flex">
                <button
                  type="button"
                  onClick={() => goToIndex(i)}
                  aria-label={`Show ${product.name}`}
                  aria-current={i === active}
                  className="group grid h-9 place-items-center px-1"
                >
                  <span
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === active
                        ? "w-7 bg-primary"
                        : "w-1.5 bg-line group-hover:w-3 group-hover:bg-primary/50"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-center text-xs text-muted sm:mt-6">
            Drag the shelf sideways, or keep scrolling — it turns either way
          </p>
        </div>
      </div>
    </section>
  );
}
