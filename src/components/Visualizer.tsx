import { useEffect, useRef } from "react";
import type { Soundscape } from "../lib/audio";

const BARS = 26;

export function Visualizer({
  engine,
  playing,
  compact = false,
}: {
  engine: Soundscape;
  playing: boolean;
  compact?: boolean;
}) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const data = new Uint8Array(new ArrayBuffer(128));
    let frame = 0;

    const render = () => {
      engine.getLevels(data);
      for (let index = 0; index < BARS; index += 1) {
        const element = refs.current[index];
        if (!element) continue;
        const raw = (data[Math.min(127, index * 2 + 2)] - 128) / 128;
        const sample = Math.abs(raw);
        const value = playing
          ? Math.max(0.08, Math.min(1, sample * 3.2))
          : 0.06;
        element.style.transform = `scaleY(${value.toFixed(3)})`;
      }
      frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frame);
  }, [engine, playing]);

  return (
    <div
      className={`visualizer ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: BARS }, (_, index) => (
        <span
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          style={{ animationDelay: `${index * 28}ms` }}
        />
      ))}
    </div>
  );
}
