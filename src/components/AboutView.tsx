import { Icon } from "./Icons";

export function AboutView() {
  return (
    <div className="page-view about-view">
      <header className="view-head">
        <div>
          <span className="eyebrow">Informazioni</span>
          <h1>Un atlante, non un catalogo</h1>
          <p>
            Onda Atlas è un esperimento di interfaccia e di sintesi audio: la
            Terra come strumento musicale.
          </p>
        </div>
      </header>

      <div className="about-grid">
        <section className="about-card">
          <h2>
            <Icon name="globe" size={18} /> Come funziona
          </h2>
          <p>
            Sei luoghi reali, sei paesaggi sonori. Il suono non è un file: viene
            sintetizzato nel browser con rumore filtrato, oscillatori e eventi
            casuali. Stagione e ora del giorno cambiano timbro e attività.
          </p>
          <p>
            I quattro livelli — Aria, Acqua, Terra, Vita — sono livelli di
            sintesi, non tracce separate. Puoi modellarli in tempo reale.
          </p>
        </section>

        <section className="about-card">
          <h2>
            <Icon name="clock" size={18} /> Sessione, non avanzamento
          </h2>
          <p>
            Un paesaggio sonoro non ha una durata. Al posto della barra di
            avanzamento c'è un timer di sessione: 20, 45, 90 minuti o infinito.
            Quando il tempo finisce, l'audio si ferma e il diario conserva la
            visita.
          </p>
        </section>

        <section className="about-card">
          <h2>
            <Icon name="sparkle" size={18} /> Perché non è Spotify
          </h2>
          <p>
            Non ci sono catalogo, account, algoritmi di raccomandazione o
            pubblicità. Non ci sono brani di terzi: solo suoni generati. Non c'è
            alcuna affiliazione con Spotify, e non vengono usati suoi loghi,
            icone, codice o asset.
          </p>
        </section>

        <section className="about-card">
          <h2>
            <Icon name="info" size={18} /> Dati e crediti
          </h2>
          <ul className="credits-list">
            <li>Dati geografici: Natural Earth, pubblico dominio</li>
            <li>TopoJSON: world-atlas (ISC)</li>
            <li>Proiezioni: d3-geo (ISC)</li>
            <li>UI: React (MIT), Vite (MIT)</li>
            <li>Audio: Web Audio API, sintesi originale</li>
          </ul>
          <p className="small">
            Documentazione del codice con TypeDoc. Nessun dato lascia il
            dispositivo.
          </p>
        </section>
      </div>
    </div>
  );
}
