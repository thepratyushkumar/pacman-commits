import { GRID_HEIGHT, GRID_WIDTH, type Direction, type GameConfig, type SimulationResult } from "../pacman-extension/types.js";
import { getThemePalette } from "./theme.js";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildTimeline(values: string[]): { values: string; keyTimes: string } {
  if (values.length === 1) {
    return { values: `${values[0]};${values[0]}`, keyTimes: "0;1" };
  }

  const compressedValues: string[] = [];
  const compressedTimes: string[] = [];

  for (let index = 0; index < values.length; index += 1) {
    if (index === 0 || values[index] !== values[index - 1]) {
      compressedValues.push(values[index]!);
      compressedTimes.push((index / (values.length - 1)).toFixed(4));
    }
  }

  if (compressedTimes[compressedTimes.length - 1] !== "1.0000") {
    compressedValues.push(values[values.length - 1]!);
    compressedTimes.push("1.0000");
  }

  return {
    values: compressedValues.join(";"),
    keyTimes: compressedTimes.join(";"),
  };
}

function directionToAngle(direction: Direction): string {
  switch (direction) {
    case "up":
      return "-90";
    case "down":
      return "90";
    case "left":
      return "180";
    case "right":
      return "0";
  }
}

function pacmanPath(radius: number, mouth: number): string {
  const start = mouth;
  const end = Math.PI * 2 - mouth;
  const startX = Math.cos(start) * radius;
  const startY = Math.sin(start) * radius;
  const endX = Math.cos(end) * radius;
  const endY = Math.sin(end) * radius;

  return [
    "M 0 0",
    `L ${startX.toFixed(2)} ${startY.toFixed(2)}`,
    `A ${radius} ${radius} 0 1 1 ${endX.toFixed(2)} ${endY.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function ghostBodyPath(radius: number): string {
  const height = radius * 1.5;
  return [
    `M ${-radius} ${height * 0.6}`,
    `L ${-radius} ${-height * 0.1}`,
    `Q ${-radius} ${-height} 0 ${-height}`,
    `Q ${radius} ${-height} ${radius} ${-height * 0.1}`,
    `L ${radius} ${height * 0.6}`,
    `L ${radius * 0.45} ${height * 0.15}`,
    `L 0 ${height * 0.6}`,
    `L ${-radius * 0.45} ${height * 0.15}`,
    "Z",
  ].join(" ");
}

export function renderGameSvg(simulation: SimulationResult, config: GameConfig): string {
  const palette = getThemePalette(config.theme);
  const step = config.cellSize + 4;
  const square = config.cellSize;
  const radius = square / 2;
  const left = 28;
  const top = 42;
  const width = left * 2 + step * (GRID_WIDTH - 1) + square;
  const height = top + step * GRID_HEIGHT + 60;
  const durationMs = simulation.frames.length * config.animationSpeedMs;
  const title = `${simulation.source.username}'s contribution Pac-Man`;
  const sourceLabel =
    simulation.source.source === "live"
      ? "Live GitHub contributions via pacman-contribution-graph"
      : "Sample contribution fallback";

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`;
  svg += `<title id="title">${escapeXml(title)}</title>`;
  svg += `<desc id="desc">${escapeXml(
    `Pac-Man traverses a GitHub contribution board while ghosts chase through the graph. Final score ${simulation.finalState.score}.`,
  )}</desc>`;
  svg += `<rect width="100%" height="100%" fill="${palette.background}"/>`;
  svg += `<text x="${left}" y="22" fill="${palette.text}" font-size="16" font-family="'Trebuchet MS', sans-serif" font-weight="700">${escapeXml(title)}</text>`;
  svg += `<text x="${left}" y="${height - 18}" fill="${palette.monthLabel}" font-size="11" font-family="'Trebuchet MS', sans-serif">${escapeXml(
    `${sourceLabel} • score ${simulation.finalState.score} • ${simulation.frames.length} frames`,
  )}</text>`;

  let lastMonth = "";
  simulation.frames[0]!.monthLabels.forEach((label, col) => {
    if (!label || label === lastMonth) {
      return;
    }

    lastMonth = label;
    const x = left + col * step + square / 2;
    svg += `<text x="${x}" y="${top - 14}" text-anchor="middle" fill="${palette.monthLabel}" font-size="10" font-family="'Trebuchet MS', sans-serif">${escapeXml(
      label,
    )}</text>`;
  });

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    for (let col = 0; col < GRID_WIDTH; col += 1) {
      const x = left + col * step;
      const y = top + row * step;
      const isWall = simulation.frames[0]!.walls[row]![col];
      const fill = isWall ? palette.wall : palette.floor;
      svg += `<rect x="${x}" y="${y}" width="${square}" height="${square}" rx="5" fill="${fill}" stroke="${palette.gridLine}" stroke-width="1"/>`;

      if (isWall) {
        continue;
      }

      const pelletFrames = simulation.frames.map((frame) =>
        frame.grid[row]![col] === 1 ? "1" : "0",
      );
      const powerFrames = simulation.frames.map((frame) =>
        frame.grid[row]![col] === 4 ? "1" : "0",
      );
      const pelletTimeline = buildTimeline(pelletFrames);
      const powerTimeline = buildTimeline(powerFrames);

      svg += `<circle cx="${x + square / 2}" cy="${y + square / 2}" r="${Math.max(2, square * 0.12)}" fill="${palette.pellet}" opacity="0">`;
      svg += `<animate attributeName="opacity" dur="${durationMs}ms" repeatCount="indefinite" values="${pelletTimeline.values}" keyTimes="${pelletTimeline.keyTimes}"/>`;
      svg += `</circle>`;

      svg += `<circle cx="${x + square / 2}" cy="${y + square / 2}" r="${Math.max(3.6, square * 0.2)}" fill="${palette.powerPellet}" opacity="0">`;
      svg += `<animate attributeName="opacity" dur="${durationMs}ms" repeatCount="indefinite" values="${powerTimeline.values}" keyTimes="${powerTimeline.keyTimes}"/>`;
      svg += `</circle>`;
    }
  }

  const pacmanPositions = buildTimeline(
    simulation.frames.map((frame) => {
      const x = left + frame.pacman.col * step + square / 2;
      const y = top + frame.pacman.row * step + square / 2;
      return `${x} ${y}`;
    }),
  );
  const pacmanRotations = buildTimeline(
    simulation.frames.map((frame) => `${directionToAngle(frame.pacman.direction)} 0 0`),
  );
  const pacmanOpen = pacmanPath(radius * 0.9, 0.55);
  const pacmanClosed = pacmanPath(radius * 0.9, 0.18);

  svg += `<g id="pacman">`;
  svg += `<animateTransform attributeName="transform" type="translate" dur="${durationMs}ms" repeatCount="indefinite" values="${pacmanPositions.values}" keyTimes="${pacmanPositions.keyTimes}"/>`;
  svg += `<animateTransform attributeName="transform" additive="sum" type="rotate" dur="${durationMs}ms" repeatCount="indefinite" values="${pacmanRotations.values}" keyTimes="${pacmanRotations.keyTimes}"/>`;
  svg += `<path d="${pacmanOpen}" fill="${palette.pacman}">`;
  svg += `<animate attributeName="d" dur="420ms" repeatCount="indefinite" values="${pacmanOpen};${pacmanClosed};${pacmanOpen}"/>`;
  svg += `</path>`;
  svg += `</g>`;

  simulation.finalState.ghosts.forEach((ghost, index) => {
    const positions = buildTimeline(
      simulation.frames.map((frame) => {
        const actor = frame.ghosts[index]!;
        const x = left + actor.col * step + square / 2;
        const y = top + actor.row * step + square / 2;
        return `${x} ${y}`;
      }),
    );
    const fills = buildTimeline(
      simulation.frames.map((frame) => {
        const actor = frame.ghosts[index]!;
        return actor.mode === "frightened"
          ? palette.frightenedGhost
          : palette.ghosts[index % palette.ghosts.length]!;
      }),
    );
    const opacity = buildTimeline(
      simulation.frames.map((frame) => {
        const actor = frame.ghosts[index]!;
        return actor.released || actor.releaseIn <= 1 ? "1" : "0.45";
      }),
    );

    svg += `<g id="ghost-${ghost.id}">`;
    svg += `<animateTransform attributeName="transform" type="translate" dur="${durationMs}ms" repeatCount="indefinite" values="${positions.values}" keyTimes="${positions.keyTimes}"/>`;
    svg += `<animate attributeName="opacity" dur="${durationMs}ms" repeatCount="indefinite" values="${opacity.values}" keyTimes="${opacity.keyTimes}"/>`;
    svg += `<path d="${ghostBodyPath(radius * 0.9)}" fill="${palette.ghosts[index % palette.ghosts.length]!}">`;
    svg += `<animate attributeName="fill" dur="${durationMs}ms" repeatCount="indefinite" values="${fills.values}" keyTimes="${fills.keyTimes}"/>`;
    svg += `</path>`;
    svg += `<circle cx="-3.2" cy="-3" r="2.3" fill="#ffffff"/><circle cx="3.2" cy="-3" r="2.3" fill="#ffffff"/>`;
    svg += `<circle cx="-2.5" cy="-2.6" r="1" fill="#0f172a"/><circle cx="3.9" cy="-2.6" r="1" fill="#0f172a"/>`;
    svg += `</g>`;
  });

  svg += `</svg>`;
  return svg;
}
