import { useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
} from "d3-geo";
import { feature } from "topojson-client";
import landTopology from "world-atlas/land-110m.json";
import type { FeatureCollection } from "geojson";
import type { Place, Season } from "../lib/places";
import { displayCoordinates } from "../lib/places";

const LAND_COLORS: Record<Season, { fill: string; stroke: string }> = {
  primavera: { fill: "#3f7a57", stroke: "#2c5a3f" },
  estate: { fill: "#4d7a41", stroke: "#365c2f" },
  autunno: { fill: "#7a5a34", stroke: "#5a3f24" },
  inverno: { fill: "#6b8794", stroke: "#4c6672" },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface GlobeProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (place: Place) => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  autoRotate: boolean;
  season: Season;
  hour: number;
}

interface DragState {
  active: boolean;
  x: number;
  y: number;
}

interface RotationAnimation {
  fromLambda: number;
  toLambda: number;
  fromPhi: number;
  toPhi: number;
  start: number;
  duration: number;
}

export function Globe({
  places,
  selectedId,
  onSelect,
  zoom,
  onZoom,
  autoRotate,
  season,
  hour,
}: GlobeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pinRefs = useRef(new Map<string, HTMLButtonElement>());
  const lambdaRef = useRef(-48);
  const phiRef = useRef(-12);
  const zoomRef = useRef(zoom);
  const autoRef = useRef(autoRotate);
  const selectedRef = useRef<string | null>(selectedId);
  const seasonRef = useRef<Season>(season);
  const hourRef = useRef(hour);
  const onZoomRef = useRef(onZoom);
  const dragRef = useRef<DragState>({ active: false, x: 0, y: 0 });
  const velocityRef = useRef(0);
  const animationRef = useRef<RotationAnimation | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);

  const land = useMemo(() => {
    const collection = feature(
      landTopology as never,
      (landTopology as { objects: Record<string, unknown> }).objects
        .land as never,
    ) as unknown as FeatureCollection;
    return collection;
  }, []);

  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, () => ({
        x: Math.random(),
        y: Math.random(),
        radius: 0.3 + Math.random() * 1.3,
        alpha: 0.12 + Math.random() * 0.5,
      })),
    [],
  );

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    autoRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    onZoomRef.current = onZoom;
  }, [onZoom]);

  useEffect(() => {
    seasonRef.current = season;
  }, [season]);

  useEffect(() => {
    hourRef.current = hour;
  }, [hour]);

  useEffect(() => {
    selectedRef.current = selectedId;
    if (!selectedId) {
      animationRef.current = null;
      return;
    }
    const place = places.find((item) => item.id === selectedId);
    if (!place) return;
    const fromLambda = lambdaRef.current;
    let toLambda = -place.lon;
    while (toLambda - fromLambda > 180) toLambda -= 360;
    while (toLambda - fromLambda < -180) toLambda += 360;
    animationRef.current = {
      fromLambda,
      toLambda,
      fromPhi: phiRef.current,
      toPhi: clamp(-place.lat, -72, 72),
      start: performance.now(),
      duration: 850,
    };
  }, [selectedId, places]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath(projection, context);
    const size = { width: 0, height: 0, dpr: 1 };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.width = Math.max(1, rect.width);
      size.height = Math.max(1, rect.height);
      size.dpr = dpr;
      canvas.width = Math.round(size.width * dpr);
      canvas.height = Math.round(size.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    let frameId = 0;
    let last = performance.now();

    const draw = () => {
      const { width, height } = size;
      if (width < 2 || height < 2) return;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.405 * zoomRef.current;
      const lambda = lambdaRef.current;
      const phi = phiRef.current;
      const palette = LAND_COLORS[seasonRef.current];

      context.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        context.globalAlpha = star.alpha;
        context.fillStyle = "#dff7ff";
        context.beginPath();
        context.arc(
          star.x * width,
          star.y * height,
          star.radius,
          0,
          Math.PI * 2,
        );
        context.fill();
      });
      context.globalAlpha = 1;

      const atmosphere = context.createRadialGradient(
        cx,
        cy,
        radius * 0.94,
        cx,
        cy,
        radius * 1.2,
      );
      atmosphere.addColorStop(0, "rgba(94, 234, 212, 0.16)");
      atmosphere.addColorStop(0.55, "rgba(94, 234, 212, 0.06)");
      atmosphere.addColorStop(1, "rgba(94, 234, 212, 0)");
      context.fillStyle = atmosphere;
      context.beginPath();
      context.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
      context.fill();

      const ocean = context.createRadialGradient(
        cx - radius * 0.38,
        cy - radius * 0.42,
        radius * 0.06,
        cx,
        cy,
        radius * 1.02,
      );
      ocean.addColorStop(0, "#27607d");
      ocean.addColorStop(0.45, "#123f59");
      ocean.addColorStop(0.78, "#0a2436");
      ocean.addColorStop(1, "#06141f");
      context.fillStyle = ocean;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();

      projection
        .translate([cx, cy])
        .scale(radius)
        .rotate([lambda, phi]);

      context.beginPath();
      path(geoGraticule10());
      context.strokeStyle = "rgba(196, 240, 255, 0.14)";
      context.lineWidth = 0.6;
      context.stroke();

      context.beginPath();
      path(land);
      context.fillStyle = palette.fill;
      context.fill();
      context.strokeStyle = palette.stroke;
      context.lineWidth = 0.7;
      context.stroke();

      const sunAngle = ((hourRef.current - 6) / 24) * Math.PI * 2;
      const daylight = Math.max(0, Math.sin(sunAngle));
      const sunX = cx + Math.cos(sunAngle) * radius * 0.52;
      const sunY = cy - Math.sin(sunAngle) * radius * 0.52;
      const lightColor =
        daylight > 0.15 ? "255, 244, 214" : "170, 210, 255";

      const glow = context.createRadialGradient(
        sunX,
        sunY,
        0,
        sunX,
        sunY,
        radius * 0.58,
      );
      glow.addColorStop(
        0,
        `rgba(${lightColor}, ${0.05 + daylight * 0.09})`,
      );
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(sunX, sunY, radius * 0.58, 0, Math.PI * 2);
      context.fill();

      const shade = context.createRadialGradient(
        sunX,
        sunY,
        radius * 0.08,
        cx,
        cy,
        radius * 1.06,
      );
      shade.addColorStop(
        0,
        `rgba(${lightColor}, ${0.12 + daylight * 0.08})`,
      );
      shade.addColorStop(0.44, "rgba(255, 255, 255, 0.02)");
      shade.addColorStop(
        0.68,
        `rgba(0, 0, 0, ${0.06 + (1 - daylight) * 0.16})`,
      );
      shade.addColorStop(1, `rgba(0, 0, 0, ${0.42 + (1 - daylight) * 0.2})`);
      context.fillStyle = shade;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "rgba(214, 248, 255, 0.27)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.stroke();

      places.forEach((place) => {
        const point = projection([place.lon, place.lat]);
        const button = pinRefs.current.get(place.id);
        if (!button) return;
        const visible =
          point !== null &&
          geoDistance([place.lon, place.lat], [-lambda, -phi]) <
            Math.PI / 2 - 0.055;
        if (!point || !visible) {
          button.style.opacity = "0";
          button.style.pointerEvents = "none";
          button.tabIndex = -1;
          return;
        }
        button.style.opacity = "1";
        button.style.pointerEvents = "auto";
        button.tabIndex = 0;
        button.style.transform = `translate3d(${point[0]}px, ${point[1]}px, 0) translate(-50%, -50%)`;
      });
    };

    const frame = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      const animation = animationRef.current;

      if (animation) {
        const progress = clamp(
          (now - animation.start) / animation.duration,
          0,
          1,
        );
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        lambdaRef.current =
          animation.fromLambda +
          (animation.toLambda - animation.fromLambda) * eased;
        phiRef.current =
          animation.fromPhi +
          (animation.toPhi - animation.fromPhi) * eased;
        if (progress >= 1) animationRef.current = null;
      } else if (!dragRef.current.active) {
        if (Math.abs(velocityRef.current) > 0.03) {
          lambdaRef.current += velocityRef.current * delta * 8;
          velocityRef.current *= 0.93;
        } else if (
          autoRef.current &&
          !selectedRef.current
        ) {
          lambdaRef.current += 3.4 * delta;
        }
      }

      draw();
      frameId = window.requestAnimationFrame(frame);
    };

    frameId = window.requestAnimationFrame(frame);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [land, places, stars]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = clamp(
        zoomRef.current - event.deltaY * 0.0011,
        0.82,
        2.15,
      );
      onZoomRef.current(next);
    };
    wrap.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    (
      window as unknown as {
        __ondaGlobe?: {
          getRotation: () => { lambda: number; phi: number; zoom: number };
        };
      }
    ).__ondaGlobe = {
      getRotation: () => ({
        lambda: lambdaRef.current,
        phi: phiRef.current,
        zoom: zoomRef.current,
      }),
    };
    return () => {
      delete (
        window as unknown as {
          __ondaGlobe?: unknown;
        }
      ).__ondaGlobe;
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".pin")) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size >= 2) {
      const [first, second] = [...pointersRef.current.values()];
      pinchRef.current = {
        distance: Math.max(
          1,
          Math.hypot(first.x - second.x, first.y - second.y),
        ),
        zoom: zoomRef.current,
      };
      dragRef.current.active = false;
      velocityRef.current = 0;
      animationRef.current = null;
      try {
        wrapRef.current?.setPointerCapture(event.pointerId);
      } catch {
        // pointer capture non disponibile (eventi sintetici o browser limitati)
      }
      return;
    }

    dragRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
    };
    velocityRef.current = 0;
    animationRef.current = null;
    try {
      wrapRef.current?.setPointerCapture(event.pointerId);
    } catch {
      // pointer capture non disponibile
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [first, second] = [...pointersRef.current.values()];
      const distance = Math.hypot(
        first.x - second.x,
        first.y - second.y,
      );
      const ratio = distance / pinchRef.current.distance;
      onZoomRef.current(
        clamp(pinchRef.current.zoom * ratio, 0.82, 2.15),
      );
      return;
    }

    if (!dragRef.current.active) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    lambdaRef.current += deltaX * 0.3;
    phiRef.current = clamp(phiRef.current - deltaY * 0.3, -78, 78);
    velocityRef.current = deltaX * 0.3;
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current.active = false;
    try {
      wrapRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      // pointer capture non disponibile
    }
  };

  return (
    <div
      ref={wrapRef}
      className="globe"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={endPointer}
      role="application"
      aria-label="Globo terrestre interattivo"
    >
      <canvas ref={canvasRef} className="globe-canvas" data-testid="globe" />
      <div className="globe-pins">
        {places.map((place) => (
          <button
            key={place.id}
            ref={(node) => {
              if (node) pinRefs.current.set(place.id, node);
              else pinRefs.current.delete(place.id);
            }}
            className={`pin ${selectedId === place.id ? "selected" : ""}`}
            data-place={place.id}
            onClick={() => onSelect(place)}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={`Esplora ${place.name}, ${place.kicker}`}
            title={`${place.name} · ${displayCoordinates(place)}`}
          >
            <span
              className="pin-dot"
              style={{ background: place.colors[2] }}
            />
            <span className="pin-label">
              <strong>{place.name}</strong>
              <small>{place.kicker}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
