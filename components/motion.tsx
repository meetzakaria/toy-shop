"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------
   One scroll engine for the whole storefront.

   Two things make scroll-linked motion feel cheap, and this engine is
   built around avoiding both:

   1. Layout thrash. Reading `getBoundingClientRect()` after writing a
      style forces the browser to re-run layout mid-frame, and with a
      grid full of reacting cards that happens dozens of times per
      frame. Here geometry is measured once per resize and cached, so a
      frame is pure arithmetic followed by style writes.

   2. Raw scroll values. Binding an element straight to `scrollY` means
      a fast flick jumps it between two distant states and reads as
      stutter. Every value below is damped toward its target with a
      frame-rate independent exponential, so a flick glides.

   The loop runs only while something is moving; once every value has
   settled and the page has stopped scrolling it shuts itself down and
   waits for the next scroll event.
   ------------------------------------------------------------------ */

export type Frame = { scrollY: number; viewportH: number; dt: number };

/** A writer returns true while it still has motion left to settle. */
type Writer = (frame: Frame) => boolean;
type Measurer = () => void;

const writers = new Set<Writer>();
const measurers = new Set<Measurer>();

let running = false;
let listening = false;
let rafId = 0;
let lastTime = 0;
let lastScrollY = Number.NaN;
let idleFrames = 0;
let needsMeasure = true;
let deferredMeasure = false;
let lastWidth = 0;
let bodyObserver: ResizeObserver | null = null;

/** Roughly half a second of stillness before the loop parks itself. */
const IDLE_FRAMES = 30;

/**
 * Frame-rate independent damping. `lambda` is how eagerly the value
 * chases its target: about 7 feels cinematic, about 14 feels immediate.
 * Passing Infinity snaps, which is what reduced-motion wants.
 */
export const damp = (
  current: number,
  target: number,
  lambda: number,
  dt: number,
) => current + (target - current) * (1 - Math.exp(-lambda * dt));

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Smooth 0 to 1 ramp, so things ease rather than switch. */
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/** Linear blend between two numbers. */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** True on a touch-first device, where pointer-driven effects do not apply. */
export function isCoarsePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: none), (pointer: coarse)").matches
  );
}

function tick(now: number) {
  // A long frame (a background tab, a slow paint) must not teleport the
  // damped values, so the step is capped at about three frames of time.
  const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
  lastTime = now;

  if (needsMeasure) {
    needsMeasure = false;
    for (const measure of measurers) measure();
  }

  const scrollY = window.scrollY;
  const frame: Frame = { scrollY, viewportH: window.innerHeight, dt };

  let busy = scrollY !== lastScrollY;
  lastScrollY = scrollY;
  for (const write of writers) {
    if (write(frame)) busy = true;
  }

  // A deferred re-measure waits for the scroll to stop. On a phone the
  // address bar sliding away fires resize on every frame of a scroll, and
  // re-measuring mid-scroll makes every moving layer visibly jump.
  if (!busy && deferredMeasure) {
    deferredMeasure = false;
    needsMeasure = true;
  }

  idleFrames = busy ? 0 : idleFrames + 1;
  if (idleFrames > IDLE_FRAMES) {
    running = false;
    return;
  }
  rafId = requestAnimationFrame(tick);
}

function start() {
  idleFrames = 0;
  if (running) return;
  running = true;
  lastTime = 0;
  rafId = requestAnimationFrame(tick);
}

function remeasure() {
  needsMeasure = true;
  start();
}

/**
 * A width change is a real layout change and must be applied at once. A
 * height-only change is almost always a mobile browser hiding its address
 * bar, so that one waits until the scroll settles.
 */
function onViewportChange() {
  if (window.innerWidth !== lastWidth) {
    lastWidth = window.innerWidth;
    needsMeasure = true;
  } else {
    deferredMeasure = true;
  }
  start();
}

function ensureListeners() {
  if (listening) return;
  listening = true;
  lastWidth = window.innerWidth;
  window.addEventListener("scroll", start, { passive: true });
  // Some mobile browsers throttle scroll events during a touch drag; a
  // touchmove listener keeps the loop awake for the whole gesture.
  window.addEventListener("touchmove", start, { passive: true });
  window.addEventListener("resize", onViewportChange, { passive: true });
  window.addEventListener("orientationchange", remeasure);
  window.addEventListener("load", remeasure);
  window.visualViewport?.addEventListener("resize", onViewportChange);
  // Late-loading fonts and images change the page height; catch that too.
  if ("ResizeObserver" in window) {
    bodyObserver = new ResizeObserver(onViewportChange);
    bodyObserver.observe(document.body);
  }
}

function dropListeners() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", start);
  window.removeEventListener("touchmove", start);
  window.removeEventListener("resize", onViewportChange);
  window.removeEventListener("orientationchange", remeasure);
  window.removeEventListener("load", remeasure);
  window.visualViewport?.removeEventListener("resize", onViewportChange);
  bodyObserver?.disconnect();
  bodyObserver = null;
}

function subscribe(write: Writer, measure?: Measurer) {
  writers.add(write);
  if (measure) measurers.add(measure);
  ensureListeners();
  remeasure();

  return () => {
    writers.delete(write);
    if (measure) measurers.delete(measure);
    if (writers.size === 0) {
      dropListeners();
      cancelAnimationFrame(rafId);
      running = false;
      lastScrollY = Number.NaN;
    }
  };
}

/** Document-space geometry of an element, cached between resizes. */
type Box = { top: number; height: number };

function measureBox(el: HTMLElement, box: Box, clearTransform = false) {
  // Its own transform would otherwise feed back into the measurement.
  const previous = clearTransform ? el.style.transform : "";
  if (clearTransform) el.style.transform = "none";
  const rect = el.getBoundingClientRect();
  if (clearTransform) el.style.transform = previous;
  box.top = rect.top + window.scrollY;
  box.height = rect.height;
}

/**
 * How far an element has travelled through the viewport: 0 the moment its
 * top edge reaches the bottom of the screen, 1 when its bottom edge leaves
 * the top. The value is damped, and the callback runs inside the shared
 * frame — which is the right place to write styles straight to the DOM.
 */
export function useElementProgress(
  ref: React.RefObject<HTMLElement | null>,
  onProgress: (p: number) => void,
  lambda = 9,
) {
  const cb = useRef(onProgress);
  useEffect(() => {
    cb.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const box: Box = { top: 0, height: 0 };
    const rate = prefersReducedMotion() ? Number.POSITIVE_INFINITY : lambda;
    let smoothed = Number.NaN;

    const measure = () => measureBox(el, box);

    const write = ({ scrollY, viewportH, dt }: Frame) => {
      const travel = box.height + viewportH;
      const target = clamp01((scrollY + viewportH - box.top) / travel);

      if (Number.isNaN(smoothed)) smoothed = target;
      smoothed = damp(smoothed, target, rate, dt);
      const settling = Math.abs(smoothed - target) > 0.0004;
      if (!settling) smoothed = target;

      cb.current(smoothed);
      return settling;
    };

    return subscribe(write, measure);
  }, [ref, lambda]);
}

/**
 * Progress through a tall section that pins a sticky stage inside it.
 *
 * Returns 0 the moment the section's top reaches the top of the viewport
 * and 1 when its bottom reaches the bottom — exactly the window during
 * which the sticky child is held in place. The stage's own height is used
 * rather than `window.innerHeight`, because on a phone that number swings
 * by around a hundred pixels as the address bar hides.
 */
export function useStickyProgress(
  trackRef: React.RefObject<HTMLElement | null>,
  stageRef: React.RefObject<HTMLElement | null>,
  onProgress: (p: number) => void,
  lambda = 8,
) {
  const cb = useRef(onProgress);
  useEffect(() => {
    cb.current = onProgress;
  });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const box: Box = { top: 0, height: 0 };
    const rate = prefersReducedMotion() ? Number.POSITIVE_INFINITY : lambda;
    let stageH = 0;
    let smoothed = Number.NaN;

    const measure = () => {
      measureBox(el, box);
      stageH = stageRef.current?.getBoundingClientRect().height ?? 0;
    };

    const write = ({ scrollY, viewportH, dt }: Frame) => {
      const travel = box.height - (stageH || viewportH);
      const target =
        travel > 0
          ? clamp01((scrollY - box.top) / travel)
          : scrollY >= box.top
            ? 1
            : 0;

      if (Number.isNaN(smoothed)) smoothed = target;
      smoothed = damp(smoothed, target, rate, dt);
      const settling = Math.abs(smoothed - target) > 0.0004;
      if (!settling) smoothed = target;

      cb.current(smoothed);
      return settling;
    };

    return subscribe(write, measure);
  }, [trackRef, stageRef, lambda]);
}

/** Fraction of the whole document scrolled, damped. */
export function useDocumentProgress(onProgress: (p: number) => void) {
  const cb = useRef(onProgress);
  useEffect(() => {
    cb.current = onProgress;
  });

  useEffect(() => {
    let smoothed = Number.NaN;
    const rate = prefersReducedMotion() ? Number.POSITIVE_INFINITY : 14;

    const write = ({ scrollY, viewportH, dt }: Frame) => {
      const max = document.documentElement.scrollHeight - viewportH;
      const target = max > 0 ? clamp01(scrollY / max) : 0;

      if (Number.isNaN(smoothed)) smoothed = target;
      smoothed = damp(smoothed, target, rate, dt);
      const settling = Math.abs(smoothed - target) > 0.0004;
      if (!settling) smoothed = target;

      cb.current(smoothed);
      return settling;
    };

    return subscribe(write);
  }, []);
}

/**
 * A layer that drifts against the scroll.
 *
 * `speed` is how far it moves per pixel scrolled — negative values rise
 * (they read as far away), positive values fall (they read as near).
 * Depth comes from the spread between layers, not from any single value.
 */
export function Parallax({
  speed = 0.12,
  scale = 0,
  rotate = 0,
  lambda = 11,
  className,
  style,
  children,
}: {
  speed?: number;
  scale?: number;
  rotate?: number;
  /** How eagerly the layer chases the scroll. Lower drifts more. */
  lambda?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const box: Box = { top: 0, height: 0 };
    let smoothed = Number.NaN;
    let written = Number.NaN;

    const measure = () => measureBox(el, box, true);

    const write = ({ scrollY, viewportH, dt }: Frame) => {
      // Distance of the layer's centre from the viewport centre, in px.
      const centre = box.top - scrollY + box.height / 2 - viewportH / 2;
      if (Number.isNaN(smoothed)) smoothed = centre;

      smoothed = damp(smoothed, centre, lambda, dt);
      const settling = Math.abs(smoothed - centre) > 0.08;
      if (!settling) smoothed = centre;

      // Half a pixel of movement is below the noise floor; not writing it
      // keeps a parked layer from dirtying style on every idle frame.
      if (Math.abs(smoothed - written) < 0.05) return settling;
      written = smoothed;

      const y = -smoothed * speed;
      const s = 1 + (-smoothed / viewportH) * scale;
      const r = (-smoothed / viewportH) * rotate;
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)}) rotate(${r.toFixed(3)}deg)`;
      return settling;
    };

    return subscribe(write, measure);
  }, [speed, scale, rotate, lambda]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: "transform", ...style }}
    >
      {children}
    </div>
  );
}

/** Reveal on entry. Stays revealed — nothing flickers on scroll back up. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  amount = 0.12,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Cast so a polymorphic tag still accepts a ref without a generic dance.
  const Tag = as as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.revealed = "true";
          io.disconnect();
        }
      },
      { threshold: amount, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [amount]);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Count up to a number once the element is on screen. */
export function CountUp({
  to,
  suffix = "",
  duration = 1300,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      if (prefersReducedMotion()) {
        setValue(to);
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic keeps the last digits from crawling.
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
