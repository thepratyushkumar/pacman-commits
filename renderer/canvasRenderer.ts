import type { BrowserBootstrapData } from "../pacman-extension/types.js";
import { getThemePalette } from "./theme.js";

function escapeJson(value: string): string {
  return value.replaceAll("<", "\\u003c").replaceAll("-->", "--\\>");
}

export function renderCanvasPage(bootstrap: BrowserBootstrapData): string {
  const palette = getThemePalette(bootstrap.config.theme);
  const bootstrapJson = escapeJson(JSON.stringify(bootstrap));

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${bootstrap.source.username} contribution Pac-Man</title>
    <meta name="theme-color" content="${palette.background}" />
    <style>
      :root {
        --bg: ${palette.background};
        --panel: ${palette.scorePanel};
        --text: ${palette.text};
        --muted: ${palette.monthLabel};
        --line: ${palette.gridLine};
        --accent: ${palette.pacman};
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(255, 184, 0, 0.2), transparent 30%),
          radial-gradient(circle at bottom right, rgba(39, 213, 99, 0.18), transparent 28%),
          linear-gradient(160deg, var(--bg), color-mix(in srgb, var(--bg) 76%, #000 24%));
        color: var(--text);
        font-family: "Trebuchet MS", "Gill Sans", sans-serif;
      }

      main {
        width: min(1180px, 100%);
        margin: 0 auto;
        padding: 28px 18px 42px;
      }

      .shell {
        display: grid;
        gap: 18px;
        grid-template-columns: minmax(0, 1fr);
      }

      .hero {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        flex-wrap: wrap;
        padding: 20px 22px;
        background: linear-gradient(140deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 22px;
        backdrop-filter: blur(14px);
      }

      .eyebrow {
        margin: 0 0 6px;
        font-size: 12px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted);
      }

      h1 {
        margin: 0;
        font-size: clamp(28px, 5vw, 52px);
        line-height: 0.96;
      }

      .hero p {
        margin: 10px 0 0;
        max-width: 62ch;
        color: var(--muted);
      }

      .legend {
        display: grid;
        gap: 10px;
        align-content: start;
        min-width: 220px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--muted);
      }

      .legend-swatch {
        width: 14px;
        height: 14px;
        border-radius: 999px;
      }

      #app {
        background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 22px;
        padding: 18px;
        backdrop-filter: blur(12px);
      }

      @media (max-width: 720px) {
        main {
          padding: 18px 12px 28px;
        }

        .hero,
        #app {
          border-radius: 18px;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div>
          <p class="eyebrow">Contribution Graph Arcade</p>
          <h1>${bootstrap.source.username}<br />Pac-Man Board</h1>
          <p>
            A modular Pac-Man engine powered by <code>pacman-contribution-graph</code>.
            Use the arrow keys in manual mode, or let autoplay clear the board.
          </p>
        </div>
        <div class="legend">
          <div class="legend-item"><span class="legend-swatch" style="background:${palette.pacman}"></span>Pac-Man</div>
          <div class="legend-item"><span class="legend-swatch" style="background:${palette.ghosts[0]}"></span>Ghost pack</div>
          <div class="legend-item"><span class="legend-swatch" style="background:${palette.powerPellet}"></span>Power pellet</div>
          <div class="legend-item"><span class="legend-swatch" style="background:${palette.pellet}"></span>Contribution pellet</div>
        </div>
      </section>
      <section id="app" aria-live="polite"></section>
    </main>
    <script id="pacman-bootstrap" type="application/json">${bootstrapJson}</script>
    <script type="module">
      import { mountPacmanDemo } from "./runtime/renderer/canvasRuntime.js";

      const bootstrap = JSON.parse(document.getElementById("pacman-bootstrap").textContent);
      mountPacmanDemo(document.getElementById("app"), bootstrap);
    </script>
  </body>
</html>`;
}
