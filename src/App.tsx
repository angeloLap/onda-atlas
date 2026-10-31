import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Globe } from "./components/Globe";
import { ExplorePanel, PlacePanel } from "./components/PlacePanel";
import { Player } from "./components/Player";
import { JournalView } from "./components/JournalView";
import { PlacesView } from "./components/PlacesView";
import { AboutView } from "./components/AboutView";
import { Icon } from "./components/Icons";
import { Soundscape } from "./lib/audio";
import {
  PLACES,
  SEASONS,
  getPlace,
  hourLabel,
  nextPlace,
  randomPlace,
  type LayerId,
  type Place,
  type Season,
  type Visit,
} from "./lib/places";
import { formatTime, type ViewId } from "./lib/ui";

const VISITS_KEY = "onda.visits.v1";
const PREFS_KEY = "onda.prefs.v1";
const MIX_KEY = "onda.mix.v1";

interface Prefs {
  volume: number;
  season: Season;
  hour: number;
  sessionMinutes: number;
  autoRotate: boolean;
}

const DEFAULT_PREFS: Prefs = {
  volume: 0.78,
  season: "primavera",
  hour: 9,
  sessionMinutes: 45,
  autoRotate: true,
};

const TITLES: Record<ViewId, { eyebrow: string; title: string }> = {
  atlas: { eyebrow: "Atlante sonoro", title: "Il pianeta che suona" },
  journal: { eyebrow: "Diario di viaggio", title: "Tracce terrestri" },
  places: { eyebrow: "Sei paesaggi", title: "Tutti i luoghi" },
  about: { eyebrow: "Informazioni", title: "Onda Atlas" },
};

const MOBILE_NAV: { id: ViewId; label: string; icon: "globe" | "book" | "pin" | "info" }[] =
  [
    { id: "atlas", label: "Atlante", icon: "globe" },
    { id: "journal", label: "Diario", icon: "book" },
    { id: "places", label: "Luoghi", icon: "pin" },
    { id: "about", label: "Info", icon: "info" },
  ];

function loadVisits(): Visit[] {
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Visit[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (visit) =>
        visit &&
        typeof visit.placeId === "string" &&
        PLACES.some((place) => place.id === visit.placeId),
    );
  } catch {
    return [];
  }
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_PREFS.volume,
      season:
        parsed.season && SEASONS.some((item) => item.id === parsed.season)
          ? parsed.season
          : DEFAULT_PREFS.season,
      hour:
        typeof parsed.hour === "number"
          ? Math.min(23, Math.max(0, parsed.hour))
          : DEFAULT_PREFS.hour,
      sessionMinutes:
        typeof parsed.sessionMinutes === "number"
          ? parsed.sessionMinutes
          : DEFAULT_PREFS.sessionMinutes,
      autoRotate:
        typeof parsed.autoRotate === "boolean"
          ? parsed.autoRotate
          : DEFAULT_PREFS.autoRotate,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function loadMix(): Record<string, Record<LayerId, number>> {
  try {
    const raw = localStorage.getItem(MIX_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<
      string,
      Record<LayerId, number>
    >;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function App() {
  const initialPrefs = useMemo(loadPrefs, []);
  const engine = useMemo(() => new Soundscape(), []);

  const [view, setView] = useState<ViewId>("atlas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState("amazzonia");
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [autoRotate, setAutoRotate] = useState(initialPrefs.autoRotate);
  const [season, setSeason] = useState<Season>(initialPrefs.season);
  const [hour, setHour] = useState(initialPrefs.hour);
  const [volume, setVolume] = useState(initialPrefs.volume);
  const [layers, setLayers] = useState<Record<LayerId, number>>(
    getPlace("amazzonia").layers,
  );
  const [mix, setMix] = useState<Record<string, Record<LayerId, number>>>(
    loadMix,
  );
  const [visits, setVisits] = useState<Visit[]>(loadVisits);
  const [elapsed, setElapsed] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(
    initialPrefs.sessionMinutes,
  );
  const [sessionComplete, setSessionComplete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const currentPlace = getPlace(currentId);
  const selectedPlace = selectedId ? getPlace(selectedId) : null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    engine.setVolume(volume);
  }, [engine, volume]);

  useEffect(() => {
    engine.setEnvironment({ season, hour });
  }, [engine, season, hour]);

  useEffect(() => {
    const handler = () => engine.dispose();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [engine]);

  useEffect(() => {
    try {
      localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
    } catch {
      // Storage non disponibile: la sessione resta in memoria.
    }
  }, [visits]);

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          volume,
          season,
          hour,
          sessionMinutes,
          autoRotate,
        } satisfies Prefs),
      );
    } catch {
      // Storage non disponibile.
    }
  }, [volume, season, hour, sessionMinutes, autoRotate]);

  useEffect(() => {
    try {
      localStorage.setItem(MIX_KEY, JSON.stringify(mix));
    } catch {
      // Storage non disponibile.
    }
  }, [mix]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!playing || sessionMinutes === 0) return;
    if (elapsed < sessionMinutes * 60) return;
    engine.pause();
    setPlaying(false);
    setSessionComplete(true);
    setElapsed(sessionMinutes * 60);
    showToast("Sessione completata. La visita è nel diario.");
  }, [elapsed, sessionMinutes, playing, engine, showToast]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const recordVisit = useCallback((placeId: string) => {
    setVisits((previous) => {
      const existing = previous.find((visit) => visit.placeId === placeId);
      const now = Date.now();
      if (existing) {
        return previous.map((visit) =>
          visit.placeId === placeId
            ? { ...visit, lastAt: now, count: visit.count + 1 }
            : visit,
        );
      }
      return [
        ...previous,
        { placeId, firstAt: now, lastAt: now, count: 1, note: "" },
      ];
    });
  }, []);

  const applyLayers = useCallback(
    (nextLayers: Record<LayerId, number>) => {
      (Object.keys(nextLayers) as LayerId[]).forEach((layer) => {
        engine.setLayer(layer, nextLayers[layer]);
      });
    },
    [engine],
  );

  const startPlace = useCallback(
    async (place: Place, record = true) => {
      const nextLayers = mix[place.id] ?? place.layers;
      setCurrentId(place.id);
      setSelectedId(place.id);
      setLayers(nextLayers);
      setPlaying(true);
      setSessionComplete(false);
      try {
        await engine.play(place);
        applyLayers(nextLayers);
        if (record) recordVisit(place.id);
      } catch (error) {
        console.error(error);
        setPlaying(false);
        showToast("Audio non disponibile in questo browser.");
      }
    },
    [applyLayers, engine, mix, recordVisit, showToast],
  );

  const togglePlay = useCallback(async () => {
    if (playing) {
      engine.pause();
      setPlaying(false);
      return;
    }
    if (sessionComplete) {
      setElapsed(0);
      setSessionComplete(false);
    }
    const firstVisit = !visits.some(
      (visit) => visit.placeId === currentPlace.id,
    );
    await startPlace(currentPlace, firstVisit);
  }, [
    currentPlace,
    engine,
    playing,
    sessionComplete,
    startPlace,
    visits,
  ]);

  const handleSelect = useCallback(
    (place: Place) => {
      setSelectedId(place.id);
      setView("atlas");
      if (playing && place.id !== currentId) {
        void startPlace(place, true);
      } else if (!playing) {
        setCurrentId(place.id);
        setLayers(mix[place.id] ?? place.layers);
      }
    },
    [currentId, mix, playing, startPlace],
  );

  const handlePanelToggle = useCallback(
    async (place: Place) => {
      if (playing && currentId === place.id) {
        engine.pause();
        setPlaying(false);
        return;
      }
      if (sessionComplete) {
        setElapsed(0);
        setSessionComplete(false);
      }
      const shouldRecord =
        (playing && currentId !== place.id) ||
        (!playing &&
          !visits.some((visit) => visit.placeId === place.id));
      await startPlace(place, shouldRecord);
    },
    [
      currentId,
      engine,
      playing,
      sessionComplete,
      startPlace,
      visits,
    ],
  );

  const skip = useCallback(
    async (direction: number) => {
      const place = nextPlace(currentId, direction);
      setSelectedId(place.id);
      if (playing) {
        await startPlace(place, true);
      } else {
        setCurrentId(place.id);
        setLayers(mix[place.id] ?? place.layers);
      }
    },
    [currentId, mix, playing, startPlace],
  );

  const handleRandom = useCallback(async () => {
    const place = randomPlace(currentId);
    setView("atlas");
    setSelectedId(place.id);
    if (playing) {
      await startPlace(place, true);
    } else {
      setCurrentId(place.id);
      setLayers(mix[place.id] ?? place.layers);
    }
  }, [currentId, mix, playing, startPlace]);

  const handleLayer = useCallback(
    (layer: LayerId, value: number) => {
      const targetId = selectedId ?? currentId;
      const base = mix[targetId] ?? getPlace(targetId).layers;
      const next = { ...base, [layer]: value };
      setLayers(next);
      setMix((previous) => ({ ...previous, [targetId]: next }));
      if (targetId === currentId) {
        engine.setLayer(layer, value);
      }
    },
    [currentId, engine, mix, selectedId],
  );

  const handleNote = useCallback((placeId: string, note: string) => {
    setVisits((previous) =>
      previous.map((visit) =>
        visit.placeId === placeId ? { ...visit, note } : visit,
      ),
    );
  }, []);

  const handleVolume = useCallback((value: number) => {
    setVolume(clamp(value, 0, 1));
  }, []);

  const handleSession = useCallback((minutes: number) => {
    setSessionMinutes(minutes);
    setElapsed(0);
    setSessionComplete(false);
  }, []);

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button")) {
        if (event.key === "Escape") setSelectedId(null);
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        void togglePlay();
      } else if (event.key.toLowerCase() === "n") {
        void skip(1);
      } else if (event.key.toLowerCase() === "p") {
        void skip(-1);
      } else if (event.key.toLowerCase() === "r") {
        void handleRandom();
      } else if (event.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    (
      window as unknown as {
        __onda?: {
          getState: () => Record<string, unknown>;
        };
      }
    ).__onda = {
      getState: () => ({
        ...engine.getState(),
        playing,
        selectedId,
        currentId,
        season,
        hour,
        elapsed,
        sessionMinutes,
        view,
        visits: visits.map((visit) => ({
          placeId: visit.placeId,
          count: visit.count,
          note: visit.note,
        })),
      }),
    };
  }, [
    currentId,
    elapsed,
    engine,
    hour,
    playing,
    season,
    selectedId,
    sessionMinutes,
    view,
    visits,
  ]);

  const visitForSelected = selectedPlace
    ? visits.find((visit) => visit.placeId === selectedPlace.id)
    : undefined;
  const selectedLayers = selectedPlace
    ? mix[selectedPlace.id] ?? selectedPlace.layers
    : layers;

  return (
    <div className="app">
      <Sidebar
        view={view}
        onView={setView}
        currentPlace={currentPlace}
        playing={playing}
        onRandom={() => void handleRandom()}
        journalCount={visits.length}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <span>{TITLES[view].eyebrow}</span>
            <strong>{TITLES[view].title}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`status-pill ${playing ? "live" : ""}`}>
              <i />
              {playing ? "In ascolto" : "In pausa"}
            </span>
            <span className="session-pill">
              <Icon name="clock" size={14} />
              {formatTime(elapsed)} /{" "}
              {sessionMinutes === 0 ? "∞" : `${sessionMinutes} min`}
            </span>
            <button
              className="icon-button"
              onClick={() => setView("about")}
              aria-label="Informazioni"
              title="Informazioni"
            >
              <Icon name="info" size={17} />
            </button>
          </div>
        </header>

        <nav className="mobile-nav" aria-label="Navigazione mobile">
          {MOBILE_NAV.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => setView(item.id)}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={`content ${view === "atlas" ? "atlas-content" : ""}`}>
          {view === "atlas" ? (
            <section
              className={`atlas ${selectedPlace ? "panel-open" : ""}`}
              aria-label="Atlante"
            >
              <Globe
                places={PLACES}
                selectedId={selectedId}
                onSelect={handleSelect}
                zoom={zoom}
                onZoom={setZoom}
                autoRotate={autoRotate}
                season={season}
                hour={hour}
              />

              <div className="atlas-intro">
                <span className="eyebrow">Sei luoghi · un pianeta</span>
                <h1>
                  La Terra non si ascolta.
                  <br />
                  Si attraversa.
                </h1>
                <p>
                  Trascina il globo, scegli un luogo e lascia che il paesaggio
                  suoni. Nessun catalogo: solo scene che non si ripetono.
                </p>
              </div>

              <div className="env-card" aria-label="Ambiente sonoro">
                <div className="env-head">
                  <span>
                    <Icon name={hour >= 6 && hour < 20 ? "sun" : "moon"} size={15} />
                    Ambiente
                  </span>
                  <small>{hourLabel(hour)}</small>
                </div>
                <label className="env-row">
                  <span>Stagione</span>
                  <select
                    value={season}
                    onChange={(event) =>
                      setSeason(event.target.value as Season)
                    }
                    aria-label="Stagione"
                  >
                    {SEASONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="env-row hour-row">
                  <span>
                    Ora <strong>{String(hour).padStart(2, "0")}:00</strong>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={23}
                    value={hour}
                    onChange={(event) => setHour(Number(event.target.value))}
                    aria-label="Ora del giorno"
                  />
                </label>
              </div>

              <div className="globe-controls" aria-label="Controlli globo">
                <button
                  className="icon-button"
                  onClick={() => setZoom((value) => clamp(value - 0.15, 0.82, 2.15))}
                  aria-label="Riduci zoom"
                >
                  <Icon name="minus" size={15} />
                </button>
                <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                <button
                  className="icon-button"
                  onClick={() => setZoom((value) => clamp(value + 0.15, 0.82, 2.15))}
                  aria-label="Aumenta zoom"
                >
                  <Icon name="plus" size={15} />
                </button>
                <span className="control-divider" />
                <button
                  className={`icon-button ${autoRotate ? "active" : ""}`}
                  onClick={() => setAutoRotate((value) => !value)}
                  aria-label="Rotazione automatica"
                  aria-pressed={autoRotate}
                  title="Rotazione automatica"
                >
                  <Icon name="rotate" size={15} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => void handleRandom()}
                  aria-label="Vagabondaggio"
                  title="Portami altrove (R)"
                >
                  <Icon name="dice" size={15} />
                </button>
              </div>

              <div className="globe-legend">
                <span>
                  <i className="legend-dot" /> Trascina per ruotare
                </span>
                <span>Scorri per zoom</span>
                <span>Seleziona un pin</span>
              </div>

              {selectedPlace ? (
                <PlacePanel
                  place={selectedPlace}
                  playing={playing}
                  currentId={currentId}
                  layers={selectedLayers}
                  visit={visitForSelected}
                  onToggle={() => void handlePanelToggle(selectedPlace)}
                  onClose={() => setSelectedId(null)}
                  onLayer={handleLayer}
                  onNote={(note) => handleNote(selectedPlace.id, note)}
                  onNext={() => void skip(1)}
                />
              ) : (
                <ExplorePanel
                  places={PLACES}
                  onSelect={handleSelect}
                  onRandom={() => void handleRandom()}
                />
              )}
            </section>
          ) : null}

          {view === "journal" ? (
            <JournalView
              visits={visits}
              onOpen={handleSelect}
              onNote={handleNote}
            />
          ) : null}

          {view === "places" ? (
            <PlacesView
              places={PLACES}
              currentId={currentId}
              playing={playing}
              onOpen={handleSelect}
              onPlay={(place) => {
                setView("atlas");
                void handlePanelToggle(place);
              }}
            />
          ) : null}

          {view === "about" ? <AboutView /> : null}
        </div>
      </main>

      <Player
        place={currentPlace}
        playing={playing}
        elapsed={elapsed}
        sessionMinutes={sessionMinutes}
        sessionComplete={sessionComplete}
        volume={volume}
        engine={engine}
        onToggle={() => void togglePlay()}
        onNext={() => void skip(1)}
        onPrev={() => void skip(-1)}
        onVolume={handleVolume}
        onSession={handleSession}
        onOpenPlace={() => {
          setSelectedId(currentPlace.id);
          setView("atlas");
        }}
      />

      {toast ? (
        <div className="toast" role="status">
          <Icon name="sparkle" size={15} />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
