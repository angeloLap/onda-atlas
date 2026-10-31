import { Icon } from "./Icons";
import { PlaceArt } from "./PlaceArt";
import { Visualizer } from "./Visualizer";
import type { Soundscape } from "../lib/audio";
import { displayCoordinates, type Place } from "../lib/places";
import { SESSION_OPTIONS, formatTime } from "../lib/ui";

export function Player({
  place,
  playing,
  elapsed,
  sessionMinutes,
  sessionComplete,
  volume,
  engine,
  onToggle,
  onNext,
  onPrev,
  onVolume,
  onSession,
  onOpenPlace,
}: {
  place: Place;
  playing: boolean;
  elapsed: number;
  sessionMinutes: number;
  sessionComplete: boolean;
  volume: number;
  engine: Soundscape;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolume: (value: number) => void;
  onSession: (minutes: number) => void;
  onOpenPlace: () => void;
}) {
  const total = sessionMinutes * 60;
  const progress =
    sessionMinutes > 0 ? Math.min(1, elapsed / total) : 0;
  const remaining =
    sessionMinutes > 0 ? Math.max(0, total - elapsed) : 0;
  const muted = volume === 0;

  return (
    <footer className="player" aria-label="Lettore">
      <button className="player-now" onClick={onOpenPlace}>
        <span className="player-art">
          <PlaceArt place={place} showPin={false} />
        </span>
        <span className="player-meta">
          <strong>{place.name}</strong>
          <small>{place.kicker}</small>
          <span className="player-coords">{displayCoordinates(place)}</span>
        </span>
      </button>

      <div className="player-center">
        <div className="player-controls">
          <button
            className="icon-button"
            onClick={onPrev}
            aria-label="Luogo precedente"
            title="Luogo precedente (P)"
          >
            <Icon name="prev" size={18} />
          </button>
          <button
            className="play-button"
            onClick={onToggle}
            aria-label={playing ? "Metti in pausa" : "Ascolta"}
            title="Play / pausa (Spazio)"
          >
            <Icon name={playing ? "pause" : "play"} size={20} />
          </button>
          <button
            className="icon-button"
            onClick={onNext}
            aria-label="Luogo successivo"
            title="Luogo successivo (N)"
          >
            <Icon name="next" size={18} />
          </button>
        </div>

        <div className="session">
          <span className="session-time">{formatTime(elapsed)}</span>
          <div
            className={`session-track ${sessionMinutes === 0 ? "infinite" : ""}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={sessionMinutes || 1}
            aria-valuenow={Math.round(elapsed / 60)}
            aria-label="Avanzamento sessione"
          >
            <span
              className="session-fill"
              style={{
                width:
                  sessionMinutes === 0
                    ? "100%"
                    : `${Math.round(progress * 100)}%`,
              }}
            />
          </div>
          <span className="session-time muted">
            {sessionComplete
              ? "completata"
              : sessionMinutes === 0
                ? "∞"
                : `-${formatTime(remaining)}`}
          </span>
          <div className="session-options" role="group" aria-label="Durata sessione">
            {SESSION_OPTIONS.map((option) => (
              <button
                key={option.minutes}
                className={sessionMinutes === option.minutes ? "active" : ""}
                onClick={() => onSession(option.minutes)}
                title={`Sessione ${option.label}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="player-right">
        <Visualizer engine={engine} playing={playing} compact />
        <div className="volume">
          <button
            className="icon-button"
            onClick={() => onVolume(muted ? 0.78 : 0)}
            aria-label={muted ? "Attiva audio" : "Disattiva audio"}
            title={muted ? "Attiva audio (M)" : "Disattiva audio (M)"}
          >
            <Icon name={muted ? "mute" : "volume"} size={17} />
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(event) => onVolume(Number(event.target.value) / 100)}
            aria-label="Volume"
          />
        </div>
      </div>
    </footer>
  );
}
