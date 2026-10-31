import type { SVGProps } from "react";

export type IconName =
  | "globe"
  | "book"
  | "pin"
  | "play"
  | "pause"
  | "next"
  | "prev"
  | "volume"
  | "mute"
  | "dice"
  | "compass"
  | "plus"
  | "minus"
  | "close"
  | "chevron-left"
  | "chevron-right"
  | "layers"
  | "clock"
  | "sun"
  | "moon"
  | "check"
  | "info"
  | "wave"
  | "arrow-right"
  | "sparkle"
  | "rotate";

export function Icon({
  name,
  size = 18,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const common: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...rest,
  };

  switch (name) {
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9Z" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
          <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 11h6" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case "play":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M8 5.5v13l10-6.5z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <rect x="7" y="5" width="3.6" height="14" rx="1" />
          <rect x="13.4" y="5" width="3.6" height="14" rx="1" />
        </svg>
      );
    case "next":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M6 5.5v13l9-6.5z" />
          <rect x="16" y="5.5" width="2.4" height="13" rx="1" />
        </svg>
      );
    case "prev":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M18 5.5v13L9 12z" />
          <rect x="5.6" y="5.5" width="2.4" height="13" rx="1" />
        </svg>
      );
    case "volume":
      return (
        <svg {...common}>
          <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
        </svg>
      );
    case "mute":
      return (
        <svg {...common}>
          <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        </svg>
      );
    case "dice":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "minus":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...common}>
          <path d="M14.5 6l-6 6 6 6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...common}>
          <path d="M9.5 6l6 6-6 6" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common}>
          <path d="M12 3l9 5-9 5-9-5z" />
          <path d="M3 12l9 5 9-5M3 16l9 5 9-5" opacity=".55" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.2 2" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M5 12l4.5 4.5L19 7" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5h.01" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M2 14c2.8-5.5 5.2 5.5 8 0s5.2 5.5 8 0 3-2.5 4 0" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M4 12h16M14 6l6 6-6 6" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
          <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
        </svg>
      );
    case "rotate":
      return (
        <svg {...common}>
          <path d="M4 10a8 8 0 1 1 2.3 7.3" />
          <path d="M4 5v5h5" />
        </svg>
      );
    default:
      return null;
  }
}
