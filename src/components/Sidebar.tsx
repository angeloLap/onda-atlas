import { Icon } from "./Icons";
import { displayCoordinates, type Place } from "../lib/places";
import type { ViewId } from "../lib/ui";

const NAV: { id: ViewId; label: string; icon: "globe" | "book" | "pin" }[] = [
  { id: "atlas", label: "Atlante", icon: "globe" },
  { id: "journal", label: "Diario", icon: "book" },
  { id: "places", label: "Luoghi", icon: "pin" },
];

export function Sidebar({
  view,
  onView,
  currentPlace,
  playing,
  onRandom,
  journalCount,
}: {
  view: ViewId;
  onView: (view: ViewId) => void;
  currentPlace: Place;
  playing: boolean;
  onRandom: () => void;
  journalCount: number;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="globe" size={26} />
        </span>
        <span className="brand-text">
          <strong>Onda Atlas</strong>
          <small>atlante sonoro</small>
        </span>
      </div>

      <nav className="sidebar-nav" aria-label="Navigazione principale">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${view === item.id ? "active" : ""}`}
            onClick={() => onView(item.id)}
            aria-current={view === item.id ? "page" : undefined}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
            {item.id === "journal" && journalCount > 0 ? (
              <span className="nav-count" aria-hidden="true">
                {journalCount}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="sidebar-section">
        <span className="section-label">In esplorazione</span>
        <button
          className="now-mini"
          onClick={() => onView("atlas")}
          aria-label={`Apri ${currentPlace.name} nell'atlante`}
        >
          <span
            className="mini-art"
            style={{
              background: `linear-gradient(135deg, ${currentPlace.colors[0]}, ${currentPlace.colors[1]})`,
            }}
          >
            <Icon name="wave" size={20} />
          </span>
          <span className="mini-copy">
            <strong>{currentPlace.name}</strong>
            <small>{displayCoordinates(currentPlace)}</small>
          </span>
          {playing ? (
            <span className="mini-eq" aria-label="In ascolto">
              <i />
              <i />
              <i />
            </span>
          ) : null}
        </button>
      </div>

      <button className="wander-button" onClick={onRandom}>
        <Icon name="dice" size={17} />
        <span>Vagabondaggio</span>
        <Icon name="arrow-right" size={15} className="wander-arrow" />
      </button>

      <div className="sidebar-foot">
        <button
          className={`nav-item subtle ${view === "about" ? "active" : ""}`}
          onClick={() => onView("about")}
        >
          <Icon name="info" size={16} />
          <span>Informazioni</span>
        </button>
        <p>Audio generativo · tutto locale</p>
        <p className="credits">Dati Terra: Natural Earth</p>
      </div>
    </aside>
  );
}
