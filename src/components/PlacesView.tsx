import { Icon } from "./Icons";
import { PlaceArt } from "./PlaceArt";
import { displayCoordinates, type Place } from "../lib/places";

export function PlacesView({
  places,
  currentId,
  playing,
  onOpen,
  onPlay,
}: {
  places: Place[];
  currentId: string;
  playing: boolean;
  onOpen: (place: Place) => void;
  onPlay: (place: Place) => void;
}) {
  return (
    <div className="page-view">
      <header className="view-head">
        <div>
          <span className="eyebrow">Sei paesaggi</span>
          <h1>Tutti i luoghi</h1>
          <p>
            Ogni luogo è una scena sonora generativa con coordinate reali. Scegli
            da dove iniziare.
          </p>
        </div>
      </header>

      <div className="places-grid">
        {places.map((place, index) => {
          const isCurrent = currentId === place.id;
          return (
            <article className="place-card" key={place.id}>
              <button
                className="place-card-art"
                onClick={() => onOpen(place)}
                aria-label={`Apri ${place.name}`}
              >
                <PlaceArt place={place} />
                <span className="place-card-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="place-card-kicker">{place.kicker}</span>
              </button>
              <div className="place-card-body">
                <div className="place-card-title">
                  <h2>{place.name}</h2>
                  <span>{displayCoordinates(place)}</span>
                </div>
                <p>{place.soundDescription}</p>
                <div className="place-card-actions">
                  <button
                    className="round-play"
                    onClick={() => onPlay(place)}
                    aria-label={
                      isCurrent && playing
                        ? `Metti in pausa ${place.name}`
                        : `Ascolta ${place.name}`
                    }
                  >
                    <Icon
                      name={isCurrent && playing ? "pause" : "play"}
                      size={17}
                    />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => onOpen(place)}
                  >
                    Esplora
                    <Icon name="arrow-right" size={15} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
