import { Icon } from "./Icons";
import { PlaceArt } from "./PlaceArt";
import { PLACES, displayCoordinates, getPlace, type Place, type Visit } from "../lib/places";
import { formatDate } from "../lib/ui";

export function JournalView({
  visits,
  onOpen,
  onNote,
}: {
  visits: Visit[];
  onOpen: (place: Place) => void;
  onNote: (placeId: string, note: string) => void;
}) {
  const sorted = [...visits].sort((a, b) => b.lastAt - a.lastAt);
  const sessions = visits.reduce((total, visit) => total + visit.count, 0);

  return (
    <div className="page-view">
      <header className="view-head">
        <div>
          <span className="eyebrow">Diario di viaggio</span>
          <h1>I luoghi che hai ascoltato</h1>
          <p>
            Ogni visita lascia una traccia. Le note restano sul tuo dispositivo.
          </p>
        </div>
        <div className="view-stats">
          <span>
            <strong>{visits.length}</strong> / {PLACES.length} luoghi
          </span>
          <span>
            <strong>{sessions}</strong> sessioni
          </span>
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="book" size={28} />
          </span>
          <h2>Il diario è ancora vuoto</h2>
          <p>
            Apri l'atlante, scegli un luogo e ascoltalo: la prima pagina si
            scrive da sola.
          </p>
        </div>
      ) : (
        <div className="journal-grid">
          {sorted.map((visit) => {
            const place = getPlace(visit.placeId);
            return (
              <article className="journal-card" key={visit.placeId}>
                <button
                  className="journal-art"
                  onClick={() => onOpen(place)}
                  aria-label={`Apri ${place.name}`}
                >
                  <PlaceArt place={place} />
                  <span className="journal-art-label">
                    {place.kicker}
                  </span>
                </button>
                <div className="journal-body">
                  <div className="journal-title">
                    <h2>{place.name}</h2>
                    <span>{displayCoordinates(place)}</span>
                  </div>
                  <p className="journal-meta">
                    {visit.count}{" "}
                    {visit.count === 1 ? "visita" : "visite"} · ultima{" "}
                    {formatDate(visit.lastAt)}
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Scrivi una nota di viaggio…"
                    value={visit.note}
                    onChange={(event) =>
                      onNote(visit.placeId, event.target.value)
                    }
                    aria-label={`Nota su ${place.name}`}
                  />
                  <button
                    className="text-button"
                    onClick={() => onOpen(place)}
                  >
                    Torna nell'atlante
                    <Icon name="arrow-right" size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
