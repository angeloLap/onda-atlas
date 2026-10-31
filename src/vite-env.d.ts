/// <reference types="vite/client" />

declare module "world-atlas/land-110m.json" {
  const topology: {
    type: "Topology";
    objects: Record<string, unknown>;
    arcs: number[][][];
    transform?: { scale: [number, number]; translate: [number, number] };
    bbox?: number[];
  };
  export default topology;
}
