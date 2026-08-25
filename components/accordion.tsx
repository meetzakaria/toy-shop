"use client";

import { useState } from "react";
import { ChevronDown } from "@/components/icons";

export function Accordion({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <li key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : index)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <span className="flex-1 text-sm font-semibold">{item.question}</span>
              <ChevronDown
                className={`h-4.5 w-4.5 shrink-0 text-muted transition ${
                  expanded ? "rotate-180 text-primary" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {expanded && (
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink">
                {item.answer}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
