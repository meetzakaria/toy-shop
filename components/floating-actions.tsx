"use client";

import { useEffect, useState } from "react";
import { Messenger, WhatsApp } from "@/components/icons";
import { site } from "@/lib/site";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5">
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white shadow-lg transition hover:border-primary hover:text-primary"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>
      )}
      <a
        href={site.social.messenger}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Messenger"
        className="flex h-11 items-center gap-2 rounded-full bg-[#0084ff] px-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
      >
        <Messenger className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Messenger</span>
      </a>
      <a
        href={site.social.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex h-11 items-center gap-2 rounded-full bg-[#25d366] px-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
      >
        <WhatsApp className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </div>
  );
}
