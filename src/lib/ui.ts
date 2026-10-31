export type ViewId = "atlas" | "journal" | "places" | "about";

export const SESSION_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 20, label: "20 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 90, label: "90 min" },
  { minutes: 0, label: "∞" },
];

export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}
