# Pac-Man Contribution Game

Turn a GitHub contribution graph into a Pac-Man board with a custom TypeScript game engine built on top of `pacman-contribution-graph`.

![Pac-Man contribution game](https://raw.githubusercontent.com/thepratyushkumar/pacman-commits/main/dist/pacman-contribution-game.svg)

## What This Repo Does

- Fetches GitHub contribution data with `pacman-contribution-graph`
- Converts the contribution graph into a playable Pac-Man map
- Simulates Pac-Man, ghosts, collisions, scoring, and power pellets
- Generates an animated SVG for README embedding
- Generates a browser-based Canvas demo
- Regenerates the output automatically with GitHub Actions

## Embed In a README

Use this snippet anywhere you want to show the animation:

```md
![Pac-Man contribution game](https://raw.githubusercontent.com/thepratyushkumar/pacman-commits/main/dist/pacman-contribution-game.svg)
```

## Project Outputs

- `dist/pacman-contribution-game.svg`
- `dist/pacman-contribution-game.html`

## Local Development

```bash
npm install
npm run generate
```

## Configuration

The generator reads configuration from environment variables.

- `GITHUB_USERNAME`
- `GITHUB_TOKEN`
- `PACMAN_THEME`
- `PACMAN_ANIMATION_SPEED`
- `PACMAN_GHOST_COUNT`
- `PACMAN_AUTOPLAY`

## Automation

The workflow in `.github/workflows/regenerate-pacman.yml` refreshes the generated assets every 24 hours and on manual dispatch.

## Next Step

If you want the interactive HTML version hosted publicly too, the next step is adding a GitHub Pages deploy workflow for `dist/pacman-contribution-game.html`.
