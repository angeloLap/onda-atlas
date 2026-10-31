export type Season = "primavera" | "estate" | "autunno" | "inverno";
export type LayerId = "air" | "water" | "earth" | "life";
export type EventType = "birds" | "waves" | "wind" | "bells" | "ice" | "city";

export interface SoundSpec {
  noise: "white" | "pink" | "brown";
  filter: number;
  padRoot: number;
  padScale: number[];
  padWave: OscillatorType;
  progression: number[][];
  eventRate: number;
  eventType: EventType;
  lfo: number;
}

export interface Place {
  id: string;
  name: string;
  kicker: string;
  lat: number;
  lon: number;
  description: string;
  soundDescription: string;
  colors: [string, string, string];
  layers: Record<LayerId, number>;
  sound: SoundSpec;
}

export interface Visit {
  placeId: string;
  firstAt: number;
  lastAt: number;
  count: number;
  note: string;
}

export const LAYERS: { id: LayerId; label: string; hint: string }[] = [
  { id: "air", label: "Aria", hint: "Vento, respiro, armonia" },
  { id: "water", label: "Acqua", hint: "Onde, pioggia, correnti" },
  { id: "earth", label: "Terra", hint: "Rombi, impulsi, suolo" },
  { id: "life", label: "Vita", hint: "Richiami, segnali, presenze" },
];

export const SEASONS: { id: Season; label: string; tint: string }[] = [
  { id: "primavera", label: "Primavera", tint: "#5eead4" },
  { id: "estate", label: "Estate", tint: "#ffd28a" },
  { id: "autunno", label: "Autunno", tint: "#ff9d6b" },
  { id: "inverno", label: "Inverno", tint: "#bfe8ff" },
];

export function formatCoordinate(value: number, axis: "lat" | "lon"): string {
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutes = Math.round((absolute - degrees) * 60);
  const hemisphere =
    axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "O";
  return `${degrees}°${String(minutes).padStart(2, "0")}′ ${hemisphere}`;
}

export function displayCoordinates(place: Place): string {
  return `${formatCoordinate(place.lat, "lat")} · ${formatCoordinate(place.lon, "lon")}`;
}

export function hourLabel(hour: number): string {
  if (hour < 5) return "Notte fonda";
  if (hour < 8) return "Alba";
  if (hour < 12) return "Mattina";
  if (hour < 17) return "Pomeriggio";
  if (hour < 20) return "Tramonto";
  if (hour < 23) return "Sera";
  return "Notte";
}

export const PLACES: Place[] = [
  {
    id: "amazzonia",
    name: "Amazzonia",
    kicker: "Foresta pluviale",
    lat: -3.4653,
    lon: -62.2159,
    description:
      "Il polmone verde del pianeta respira a strati: pioggia alta, foglie basse, richiami che arrivano da ogni direzione. Qui il suono non ha un centro.",
    soundDescription:
      "Pioggia filtrata, richiami lontani e un pad verde che si apre lentamente.",
    colors: ["#0f3d2e", "#1f7a5a", "#5eead4"],
    layers: { air: 0.5, water: 0.72, earth: 0.38, life: 0.88 },
    sound: {
      noise: "pink",
      filter: 1200,
      padRoot: 57,
      padScale: [0, 3, 5, 7, 10],
      padWave: "sine",
      progression: [
        [0, 3, 7, 10],
        [-4, 0, 3, 7],
        [-7, -3, 0, 3],
        [-5, -1, 2, 5],
      ],
      eventRate: 0.85,
      eventType: "birds",
      lfo: 0.07,
    },
  },
  {
    id: "pacifico",
    name: "Pacifico",
    kicker: "Oceano aperto",
    lat: 0,
    lon: -150,
    description:
      "Nessuna costa all'orizzonte. Il rumore del mare diventa una massa continua, interrotta solo da onde lunghe e da un sub che si sente più nel petto che nelle orecchie.",
    soundDescription:
      "Rumore bruno, onde lente e un drone profondo che respira ogni quattro secondi.",
    colors: ["#082338", "#115e8a", "#7dd3fc"],
    layers: { air: 0.46, water: 0.92, earth: 0.24, life: 0.26 },
    sound: {
      noise: "brown",
      filter: 520,
      padRoot: 50,
      padScale: [0, 4, 7, 11],
      padWave: "sine",
      progression: [
        [0, 4, 7, 11],
        [-5, 0, 4, 7],
        [-7, -2, 2, 5],
        [0, 4, 7, 14],
      ],
      eventRate: 0.16,
      eventType: "waves",
      lfo: 0.045,
    },
  },
  {
    id: "sahara",
    name: "Sahara",
    kicker: "Deserto",
    lat: 23.4162,
    lon: 13,
    description:
      "Il vento è l'unico musicista. Sposta la sabbia, la lascia cadere, ricomincia. Il silenzio non è vuoto: è una superficie che vibra.",
    soundDescription:
      "Vento secco, sibili lunghi e granelli che scorrono in stereo.",
    colors: ["#4a2f15", "#b9762e", "#ffd28a"],
    layers: { air: 0.86, water: 0.1, earth: 0.48, life: 0.16 },
    sound: {
      noise: "pink",
      filter: 900,
      padRoot: 55,
      padScale: [0, 1, 4, 5, 7],
      padWave: "triangle",
      progression: [
        [0, 1, 5, 7],
        [-2, 1, 4, 8],
        [-5, -1, 2, 5],
        [0, 3, 5, 10],
      ],
      eventRate: 0.12,
      eventType: "wind",
      lfo: 0.035,
    },
  },
  {
    id: "himalaya",
    name: "Himalaya",
    kicker: "Alta montagna",
    lat: 27.9881,
    lon: 86.925,
    description:
      "A ottomila metri l'aria è rarefatta e il suono perde peso. Le campane arrivano da lontano, rimbalzano sulle pareti e tornano indietro più lunghe.",
    soundDescription:
      "Aria sottile, campane lontane e un eco che si allunga sulla pietra.",
    colors: ["#243447", "#5b7894", "#dbeafe"],
    layers: { air: 0.82, water: 0.2, earth: 0.44, life: 0.3 },
    sound: {
      noise: "white",
      filter: 1800,
      padRoot: 62,
      padScale: [0, 2, 4, 7, 9],
      padWave: "sine",
      progression: [
        [0, 4, 7, 11],
        [-3, 2, 5, 9],
        [-7, -2, 2, 5],
        [-5, 0, 4, 7],
      ],
      eventRate: 0.3,
      eventType: "bells",
      lfo: 0.04,
    },
  },
  {
    id: "artico",
    name: "Artico",
    kicker: "Ghiaccio polare",
    lat: 78,
    lon: 15,
    description:
      "Il ghiaccio lavora: si tende, si incrina, risuona. Il paesaggio è bianco, ma il suono è pieno di frequenze alte e di pause lunghissime.",
    soundDescription:
      "Shimmer ghiacciato, impulsi sottili e un tappeto di vento tagliente.",
    colors: ["#0e2a38", "#3d7f95", "#bff3ff"],
    layers: { air: 0.74, water: 0.36, earth: 0.28, life: 0.34 },
    sound: {
      noise: "white",
      filter: 3000,
      padRoot: 69,
      padScale: [0, 2, 7, 9, 12],
      padWave: "sine",
      progression: [
        [0, 2, 7, 12],
        [-3, 0, 5, 9],
        [-7, -2, 5, 7],
        [-5, 0, 4, 12],
      ],
      eventRate: 0.22,
      eventType: "ice",
      lfo: 0.025,
    },
  },
  {
    id: "tokyo",
    name: "Tokyo",
    kicker: "Città notturna",
    lat: 35.6762,
    lon: 139.6503,
    description:
      "Una città che non smette mai di emettere segnali: treni, semafori, neon, passi. Il ritmo è umano, ma la scala è quella di una macchina.",
    soundDescription:
      "Rumore urbano, impulsi ritmici e segnali elettronici che si rincorrono.",
    colors: ["#1a1030", "#5b2a86", "#ff8a6b"],
    layers: { air: 0.36, water: 0.16, earth: 0.7, life: 0.74 },
    sound: {
      noise: "pink",
      filter: 700,
      padRoot: 45,
      padScale: [0, 3, 5, 6, 10],
      padWave: "square",
      progression: [
        [0, 3, 7, 10],
        [-2, 1, 5, 8],
        [-4, 0, 3, 7],
        [-5, -1, 2, 5],
      ],
      eventRate: 0.9,
      eventType: "city",
      lfo: 0.12,
    },
  },
];

export function getPlace(id: string): Place {
  return PLACES.find((place) => place.id === id) ?? PLACES[0];
}

export function nextPlace(currentId: string, direction = 1): Place {
  const index = PLACES.findIndex((place) => place.id === currentId);
  const next = (index + direction + PLACES.length) % PLACES.length;
  return PLACES[next];
}

export function randomPlace(excludeId?: string): Place {
  const candidates = PLACES.filter((place) => place.id !== excludeId);
  return candidates[Math.floor(Math.random() * candidates.length)];
}
