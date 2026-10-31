import { useId } from "react";
import type { Place } from "../lib/places";

function seededHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 9973;
  }
  return hash;
}

export function PlaceArt({
  place,
  className,
  showPin = true,
}: {
  place: Place;
  className?: string;
  showPin?: boolean;
}) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `grad-${id}`;
  const grainId = `grain-${id}`;
  const hash = seededHash(place.id);
  const cx = 150 + (hash % 110);
  const cy = 100 + (hash % 60);
  const rotation = (hash % 70) - 35;
  const [deep, mid, accent] = place.colors;

  return (
    <svg
      className={className}
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Mappa astratta di ${place.name}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={deep} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect width="400" height="250" fill={`url(#${gradientId})`} />

      <g
        fill="none"
        stroke={accent}
        strokeWidth="0.9"
        opacity="0.42"
        transform={`rotate(${rotation} ${cx} ${cy})`}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <ellipse
            key={index}
            cx={cx}
            cy={cy}
            rx={34 + index * 26 + (hash % 17)}
            ry={15 + index * 17 + (hash % 11)}
          />
        ))}
      </g>

      <g stroke={accent} strokeWidth="0.5" opacity="0.18">
        <path d="M0 190 C90 160 140 210 220 178 S340 150 400 182" fill="none" />
        <path d="M0 205 C80 185 150 225 230 196 S330 172 400 200" fill="none" />
        <path d="M0 62 C90 42 150 78 230 54 S340 34 400 58" fill="none" />
      </g>

      <g opacity="0.2" stroke={accent} strokeWidth="0.4">
        {Array.from({ length: 9 }, (_, index) => (
          <path
            key={index}
            d={`M${-40 + index * 52} 250 L${80 + index * 52} 0`}
          />
        ))}
      </g>

      {showPin ? (
        <g>
          <circle cx={cx} cy={cy} r="22" fill={accent} opacity="0.12" />
          <circle cx={cx} cy={cy} r="11" fill={accent} opacity="0.2" />
          <circle
            cx={cx}
            cy={cy}
            r="4.2"
            fill={accent}
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.4"
          />
        </g>
      ) : null}

      <rect
        width="400"
        height="250"
        filter={`url(#${grainId})`}
        opacity="0.07"
      />
    </svg>
  );
}
