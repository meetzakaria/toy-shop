import type { SVGProps } from "react";
import type { IconName } from "@/lib/types";

type Props = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function Headphones(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <path d="M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2Z" />
      <path d="M20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2Z" />
    </svg>
  );
}

export function Cable(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3v5a3 3 0 0 0 6 0V3" />
      <path d="M7 3v2M11 3v2" />
      <path d="M9 11v3a4 4 0 0 0 4 4h1a3 3 0 0 1 3 3" />
      <rect x="15" y="14" width="6" height="4" rx="1" />
    </svg>
  );
}

export function Bolt(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function Keyboard(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
  );
}

export function Watch(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="6" width="10" height="12" rx="3" />
      <path d="M9 6V3h6v3M9 18v3h6v-3M12 10v2.5l1.5 1" />
    </svg>
  );
}

export function Tv(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="5" width="20" height="12" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function Car(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 15h16M5 15l1.6-5A2 2 0 0 1 8.5 9h7a2 2 0 0 1 1.9 1L19 15" />
      <path d="M3 15h18v3H3z" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="16.5" cy="18.5" r="1.5" />
    </svg>
  );
}

export function Fan(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c0-3 1-6 3.5-6S18 7 15 9M10 12c-3 0-6-1-6-3.5S7 6 9 9M14 14c3 0 6 1 6 3.5S17 18 15 15M12 14c0 3-1 6-3.5 6S6 17 9 15" />
    </svg>
  );
}

export function Search(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function CartIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.2l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h9.1a1.6 1.6 0 0 0 1.6-1.3L21 7H5.2" />
    </svg>
  );
}

export function Truck(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7h11v9H3zM14 10h3.5l2.5 3v3h-6" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function Phone(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3h3l2 5-2.2 1.3a12 12 0 0 0 5.9 5.9L15 13l5 2v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.2 2 2 0 0 1 5 3Z" />
    </svg>
  );
}

export function Mail(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function Pin(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function Menu(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function Close(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

export function ChevronDown(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRight(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function Star({ filled = false, ...props }: Props & { filled?: boolean }) {
  return (
    <svg
      {...base}
      fill={filled ? "currentColor" : "none"}
      strokeWidth={filled ? 0 : 1.4}
      {...props}
    >
      <path d="m12 3.6 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7L6.9 19l1-5.6-4-3.9 5.6-.8Z" />
    </svg>
  );
}

export function Shield(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 5 6v5.5c0 4.3 3 8.1 7 9.5 4-1.4 7-5.2 7-9.5V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function Refresh(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11a8 8 0 1 0-1.5 5.5" />
      <path d="M20 4v5h-5" />
    </svg>
  );
}

export function Headset(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 14h3v5H6a2 2 0 0 1-2-2Zm16 0h-3v5h1a2 2 0 0 0 2-2Z" />
      <path d="M17 19v.5A2.5 2.5 0 0 1 14.5 22H12" />
    </svg>
  );
}

export function Facebook(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6A22 22 0 0 0 14.3 3.5c-2.4 0-4 1.45-4 4.1v2.3H7.6V13h2.7v8Z" />
    </svg>
  );
}

export function Instagram(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsApp(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.5-5.8c-.25-.13-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12s-.63.8-.77.96c-.14.17-.28.18-.53.06a6.6 6.6 0 0 1-1.93-1.19 7.2 7.2 0 0 1-1.33-1.66c-.14-.24 0-.37.1-.49.1-.11.25-.28.37-.42a1.6 1.6 0 0 0 .25-.41.45.45 0 0 0 0-.43c-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.72 2.72 0 0 0-.85 2.02 4.72 4.72 0 0 0 1 2.5 10.8 10.8 0 0 0 4.13 3.63c.58.25 1.03.4 1.38.51a3.3 3.3 0 0 0 1.52.1 2.5 2.5 0 0 0 1.63-1.15 2 2 0 0 0 .14-1.15c-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function Messenger(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.3 2 2 6.2 2 11.7c0 3.1 1.4 5.9 3.7 7.7V23l3.4-1.9c.9.25 1.9.4 2.9.4 5.7 0 10-4.2 10-9.7S17.7 2 12 2Zm1 12.4-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7Z" />
    </svg>
  );
}

export function ArrowRight(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function Check(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function Trash(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </svg>
  );
}

export function Box(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2Z" />
      <path d="M4 7.2 12 11.5l8-4.3M12 11.5V21" />
    </svg>
  );
}

export const categoryIcons: Record<IconName, (props: Props) => React.JSX.Element> = {
  headphones: Headphones,
  cable: Cable,
  bolt: Bolt,
  keyboard: Keyboard,
  watch: Watch,
  tv: Tv,
  car: Car,
  fan: Fan,
};
