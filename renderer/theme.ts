import type { ThemeName, ThemePalette } from "../pacman-extension/types.js";

const themes: Record<ThemeName, ThemePalette> = {
  "github-light": {
    background: "#f6f8fa",
    wall: "#d0d7de",
    floor: "#ffffff",
    gridLine: "#d8dee4",
    pellet: "#2da44e",
    powerPellet: "#bf8700",
    pacman: "#f5b700",
    frightenedGhost: "#0969da",
    ghosts: ["#cf222e", "#bf3989", "#1f6feb", "#fb8f44"],
    text: "#24292f",
    monthLabel: "#57606a",
    scorePanel: "#ffffff",
  },
  "github-dark": {
    background: "#0d1117",
    wall: "#30363d",
    floor: "#161b22",
    gridLine: "#21262d",
    pellet: "#39d353",
    powerPellet: "#d29922",
    pacman: "#f2cc60",
    frightenedGhost: "#58a6ff",
    ghosts: ["#ff7b72", "#d2a8ff", "#79c0ff", "#ffa657"],
    text: "#e6edf3",
    monthLabel: "#8b949e",
    scorePanel: "#161b22",
  },
};

export function getThemePalette(theme: ThemeName): ThemePalette {
  return themes[theme];
}
