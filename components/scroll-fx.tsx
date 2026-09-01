"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  isCoarsePointer,
  mix,
  prefersReducedMotion,
  useDocumentProgress,
  useElementProgress,
} from "@/components/motion";

/**
 * A hairline of reading progress across the very top of the page.
 *
 * It sits above the header rather than inside it, so the header component
 * stays untouched and the bar survives any future header rework.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useDocumentProgress((p) => {
    const el = ref.current;
    if (el) el.style.transform = `scaleX(${p.toFixed(4)})`;
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
    >
      <div
        ref={ref}
        className="h-full origin-left bg-linear-to-r from-primary via-primary-light to-primary"
        style={{ transform: "scaleX(0)", willChange: "transform" }}
      />
    </div>
  );
}

/**
 * Turns its child as the page scrolls past it.
 *
 * `turns` is how much of a full revolution the child sweeps through across
 * its whole trip up the viewport — a quarter turn is plenty for an icon,
 * and anything past one turn stops reading as a reaction to the scroll and
 * starts reading as a loading spinner. `lift` adds a little vertical travel
 * on the way through, which is what stops the rotation looking mechanical.
 */
export function ScrollSpin({
  turns = 0.25,
  lift = 0,
  scale = 0,
  className,
  children,
}: {
  turns?: number;
  lift?: number;
  /** Extra size at the midpoint of the trip, as a fraction. */
  scale?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useElementProgress(ref, (p) => {
    const el = ref.current;
    if (!el) return;
    const spin = mix(-turns * 180, turns * 180, p);
    const y = mix(lift, -lift, p);
    // Peaks in the middle of the trip and returns, so the element is its
    // normal size whenever it is near an edge of the screen.
    const s = 1 + Math.sin(p * Math.PI) * scale;
    el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${spin.toFixed(2)}deg) scale(${s.toFixed(4)})`;
  });

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

/**
 * A card that leans toward the pointer, with a sheen that tracks it.
 *
 * Only on devices that actually have a pointer: on a phone there is no
 * hover, and a tilt that fires on tap feels like a bug. The rotation and
 * the highlight position are written as custom properties so the CSS owns
 * the easing — the class returns to rest on its own when the pointer
 * leaves, with no JavaScript animation to unwind.
 */
export function TiltCard({
  children,
  max = 7,
  className = "",
}: {
  children: ReactNode;
  /** Maximum lean in degrees. Past about ten it stops looking physical. */
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || isCoarsePointer() || prefersReducedMotion()) return;

    let queued = false;
    let px = 0.5;
    let py = 0.5;

    const apply = () => {
      queued = false;
      el.style.setProperty("--tilt-y", `${(px - 0.5) * 2 * max}`);
      el.style.setProperty("--tilt-x", `${(0.5 - py) * 2 * max}`);
      el.style.setProperty("--sheen-x", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--sheen-y", `${(py * 100).toFixed(1)}%`);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      px = (event.clientX - rect.left) / rect.width;
      py = (event.clientY - rect.top) / rect.height;
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    const onEnter = () => {
      el.dataset.tilting = "true";
    };

    const onLeave = () => {
      delete el.dataset.tilting;
      el.style.setProperty("--tilt-x", "0");
      el.style.setProperty("--tilt-y", "0");
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max]);

  return (
    <div ref={ref} className={`tilt-card ${className}`}>
      {children}
      <span aria-hidden="true" className="tilt-sheen" />
    </div>
  );
}
