import { Icon } from "./Icons";
import { PlaceArt } from "./PlaceArt";
import {
  LAYERS,
  displayCoordinates,
  type LayerId,
  type Place,
  type Visit,
} from "../lib/places";
import { formatDate } from "../lib/ui";

export function PlacePanel({
  place,
  playing,
  currentId,
  layers,
  visit,
  onToggle,
  onClose,
  onLayer,
  onNote,
  onNext,
}: {
  place: Place;
  playing: boolean;
  currentId: string;
  layers: Record<LayerId, number>;
  visit?: Visit;
  onToggle: () => void;
  onClose: () => void;
  onLayer: (layer: LayerId, value: number) => void;
  onNote: (note: string) => void;
  onNext: () => void;
}) {
  const isCurrent = currentId === place.id;
  const isPlaying = isCurrent && playing;

  return (
    <aside className="place-panel" aria-label={`Dettagli di ${place.name}`}>
      <div className="panel-art">
        <PlaceArt place={place} />
        <div className="panel-art-fade" />
        <button
          className="icon-button panel-close"
          onClick={onClose}
          aria-label="Chiudi pannello"
        >
          <Icon name="close" size={16} />
        </button>
        <span className="panel-kicker">{place.kicker}</span>
      </div>

      <div className="panel-body">
        <div className="panel-heading">
          <h2>{place.name}</h2>
          <span className="coordinates">{displayCoordinates(place)}</span>
        </div>

        <p className="panel-description">{place.description}</p>

        <button
          className={`panel-play ${isPlaying ? "is-playing" : ""}`}
          onClick={onToggle}
        >
          <span className="panel-play-icon">
            <Icon name={isPlaying ? "pause" : "play"} size={17} />
          </span>
          <span>{isPlaying ? "Metti in pausa" : "Ascolta questo luogo"}</span>
          <span className="panel-play-hint">
            {isPlaying ? "in ascolto" : "audio generativo"}
          </span>
        </button>

        <p className="sound-quote">“{place.soundDescription}”</p>

        <div className="panel-section-head">
          <span>
            <Icon name="layers" size={14} /> Livelli
          </span>
          <small>Modella il paesaggio</small>
        </div>

        <div className="layer-list">
          {LAYERS.map((layer) => {
            const value = layers[layer.id] ?? place.layers[layer.id];
            return (
              <label key={layer.id} className="layer-row">
                <span className="layer-meta">
                  <strong>{layer.label}</strong>
                  <small>{layer.hint}</small>
                </span>
                <span className="layer-control">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(value * 100)}
                    onChange={(event) =>
                      onLayer(layer.id, Number(event.target.value) / 100)
                    }
                    aria-label={`Livello ${layer.label}`}
                  />
                  <span className="layer-value">
                    {Math.round(value * 100)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="panel-section-head">
          <span>
            <Icon name="book" size={14} /> Diario
          </span>
          {visit ? (
            <small>
              {visit.count} {visit.count === 1 ? "visita" : "visite"} ·{" "}
              {formatDate(visit.lastAt)}
            </small>
          ) : (
            <small>Non ancora visitato</small>
          )}
        </div>

        <textarea
          className="note-field"
          rows={3}
          placeholder={
            visit
              ? "Una nota su questo luogo…"
              : "Ascolta il luogo per sbloccare la nota."
          }
          value={visit?.note ?? ""}
          onChange={(event) => onNote(event.target.value)}
          disabled={!visit}
          aria-label={`Nota su ${place.name}`}
        />

        <div className="panel-footer">
          <button className="text-button" onClick={onNext}>
            Luogo successivo
            <Icon name="arrow-right" size={15} />
          </button>
          <span className="panel-seed">
            <Icon name="sparkle" size={13} /> seed {place.id.slice(0, 3)}·
            {Math.abs(Math.round(place.lat * 10))}
          </span>
        </div>
      </div>
    </aside>
  );
}

export function ExplorePanel({
  places,
  onSelect,
  onRandom,
}: {
  places: Place[];
  onSelect: (place: Place) => void;
  onRandom: () => void;
}) {
  return (
    <aside className="place-panel explore-panel" aria-label="Esplora i luoghi">
      <div className="explore-head">
        <span className="explore-kicker">Atlante</span>
        <h2>Scegli un luogo</h2>
        <p>
          Sei fermo. Trascina il globo, oppure entra in uno dei sei paesaggi
          sonori.
        </p>
      </div>

      <div className="explore-list">
        {places.map((place, index) => (
          <button
            key={place.id}
            className="explore-row"
            onClick={() => onSelect(place)}
          >
            <span className="explore-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="explore-dot"
              style={{ background: place.colors[2] }}
            />
            <span className="explore-copy">
              <strong>{place.name}</strong>
              <small>{place.kicker}</small>
            </span>
            <Icon name="chevron-right" size={15} />
          </button>
        ))}
      </div>

      <button className="wander-button wide" onClick={onRandom}>
        <Icon name="dice" size={17} />
        <span>Portami altrove</span>
      </button>

      <p className="explore-hint">
        <Icon name="compass" size={13} /> Sei sulla Terra: ogni luogo è una
        scena sonora che non si ripete.
      </p>
    </aside>
  );
}
