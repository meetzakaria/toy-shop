import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({
  compact = false,
  invert = false,
}: {
  compact?: boolean;
  invert?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} home`}
      className="flex shrink-0 items-center gap-2"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M6 4h9a4 4 0 0 1 0 8H9v8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={`block text-xl font-extrabold tracking-tight ${
              invert ? "text-white" : "text-foreground"
            }`}
          >
            {site.name}
          </span>
          <span
            className={`block text-[11px] font-medium ${
              invert ? "text-white/70" : "text-muted"
            }`}
          >
            {site.tagline}
          </span>
        </span>
      )}
    </Link>
  );
}
