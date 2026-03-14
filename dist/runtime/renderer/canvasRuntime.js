import { createInitialGameState, stepGame } from "../pacman-extension/gameEngine.js";
import { GRID_HEIGHT, GRID_WIDTH } from "../pacman-extension/types.js";
import { getThemePalette } from "./theme.js";
function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
}
function scaleCanvas(canvas, width, height) {
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas 2D context is unavailable");
    }
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return context;
}
function createRuntimeConfig(bootstrap) {
    return {
        ...bootstrap.config,
        githubUsername: bootstrap.source.username,
        githubToken: undefined,
        useLiveContributionData: bootstrap.source.source === "live",
        outputDir: new URL("./", window.location.href),
    };
}
function drawGhost(context, position, color, step, square, left, top) {
    const x = left + position.col * step + square / 2;
    const y = top + position.row * step + square / 2;
    const radius = square * 0.42;
    context.save();
    context.translate(x, y);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(-radius, radius * 0.7);
    context.lineTo(-radius, -radius * 0.2);
    context.quadraticCurveTo(-radius, -radius, 0, -radius);
    context.quadraticCurveTo(radius, -radius, radius, -radius * 0.2);
    context.lineTo(radius, radius * 0.7);
    context.lineTo(radius * 0.45, radius * 0.18);
    context.lineTo(0, radius * 0.7);
    context.lineTo(-radius * 0.45, radius * 0.18);
    context.closePath();
    context.fill();
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(-radius * 0.3, -radius * 0.22, radius * 0.18, 0, Math.PI * 2);
    context.arc(radius * 0.3, -radius * 0.22, radius * 0.18, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#111827";
    context.beginPath();
    context.arc(-radius * 0.22, -radius * 0.18, radius * 0.08, 0, Math.PI * 2);
    context.arc(radius * 0.38, -radius * 0.18, radius * 0.08, 0, Math.PI * 2);
    context.fill();
    context.restore();
}
function drawPacman(context, state, step, square, left, top, color) {
    const x = left + state.pacman.col * step + square / 2;
    const y = top + state.pacman.row * step + square / 2;
    const radius = square * 0.42;
    const mouth = Math.sin(state.turn * 0.6) > 0 ? 0.28 : 0.1;
    let baseAngle = 0;
    if (state.pacman.direction === "down") {
        baseAngle = Math.PI / 2;
    }
    else if (state.pacman.direction === "left") {
        baseAngle = Math.PI;
    }
    else if (state.pacman.direction === "up") {
        baseAngle = -Math.PI / 2;
    }
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x, y);
    context.arc(x, y, radius, baseAngle + mouth, baseAngle + Math.PI * 2 - mouth);
    context.closePath();
    context.fill();
}
function drawBoard(context, state, bootstrap, canvas) {
    const palette = getThemePalette(bootstrap.config.theme);
    const square = bootstrap.config.cellSize;
    const step = square + 4;
    const left = 26;
    const top = 46;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = palette.background;
    context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    let lastMonth = "";
    context.fillStyle = palette.monthLabel;
    context.font = "11px 'Trebuchet MS', sans-serif";
    context.textAlign = "center";
    state.map.monthLabels.forEach((label, col) => {
        if (!label || label === lastMonth) {
            return;
        }
        lastMonth = label;
        context.fillText(label, left + col * step + square / 2, top - 12);
    });
    for (let row = 0; row < GRID_HEIGHT; row += 1) {
        for (let col = 0; col < GRID_WIDTH; col += 1) {
            const x = left + col * step;
            const y = top + row * step;
            context.fillStyle = state.map.walls[row][col] ? palette.wall : palette.floor;
            context.strokeStyle = palette.gridLine;
            context.lineWidth = 1;
            roundedRect(context, x, y, square, square, 5);
            context.fill();
            context.stroke();
            if (state.map.walls[row][col]) {
                continue;
            }
            const cell = state.cells[row][col];
            if (cell === 1 || cell === 4) {
                context.fillStyle = cell === 4 ? palette.powerPellet : palette.pellet;
                context.beginPath();
                context.arc(x + square / 2, y + square / 2, cell === 4 ? Math.max(3.5, square * 0.2) : Math.max(2, square * 0.12), 0, Math.PI * 2);
                context.fill();
            }
        }
    }
    drawPacman(context, state, step, square, left, top, palette.pacman);
    state.ghosts.forEach((ghost, index) => {
        if (!ghost.released && ghost.releaseIn > 1) {
            return;
        }
        drawGhost(context, ghost, state.frightenedTurnsRemaining > 0
            ? palette.frightenedGhost
            : palette.ghosts[index % palette.ghosts.length], step, square, left, top);
    });
}
export function mountPacmanDemo(root, bootstrap) {
    const palette = getThemePalette(bootstrap.config.theme);
    const config = createRuntimeConfig(bootstrap);
    const square = bootstrap.config.cellSize;
    const step = square + 4;
    const boardWidth = 52 + step * (GRID_WIDTH - 1) + square;
    const boardHeight = 66 + step * GRID_HEIGHT;
    root.innerHTML = "";
    root.style.display = "grid";
    root.style.gap = "16px";
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "flex-start";
    header.style.gap = "16px";
    header.style.flexWrap = "wrap";
    const status = document.createElement("div");
    status.style.display = "grid";
    status.style.gap = "4px";
    const title = document.createElement("strong");
    title.textContent = bootstrap.source.source === "live" ? "Live contribution map" : "Sample contribution fallback";
    title.style.fontSize = "16px";
    const subtitle = document.createElement("span");
    subtitle.style.color = palette.monthLabel;
    subtitle.style.fontSize = "13px";
    subtitle.textContent = `Source: ${bootstrap.source.username} • ${bootstrap.source.fetchedAt.slice(0, 10)}`;
    status.append(title, subtitle);
    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "10px";
    controls.style.flexWrap = "wrap";
    const autoplayButton = document.createElement("button");
    const pauseButton = document.createElement("button");
    const restartButton = document.createElement("button");
    [autoplayButton, pauseButton, restartButton].forEach((button) => {
        button.style.border = `1px solid ${palette.gridLine}`;
        button.style.background = palette.scorePanel;
        button.style.color = palette.text;
        button.style.borderRadius = "999px";
        button.style.padding = "10px 14px";
        button.style.font = "600 13px 'Trebuchet MS', sans-serif";
        button.style.cursor = "pointer";
    });
    controls.append(autoplayButton, pauseButton, restartButton);
    header.append(status, controls);
    const stats = document.createElement("div");
    stats.style.display = "flex";
    stats.style.flexWrap = "wrap";
    stats.style.gap = "14px";
    stats.style.color = palette.monthLabel;
    stats.style.fontSize = "13px";
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.maxWidth = `${boardWidth}px`;
    canvas.style.borderRadius = "18px";
    canvas.style.background = palette.background;
    canvas.style.border = `1px solid ${palette.gridLine}`;
    const help = document.createElement("p");
    help.textContent = "Use arrow keys for manual play. Autoplay uses BFS to route Pac-Man toward pellets while avoiding nearby ghosts.";
    help.style.margin = "0";
    help.style.color = palette.monthLabel;
    help.style.fontSize = "13px";
    root.append(header, stats, canvas, help);
    const context = scaleCanvas(canvas, boardWidth, boardHeight);
    let state = createInitialGameState(bootstrap.map, config);
    let autoplay = bootstrap.config.autoplayMode;
    let paused = false;
    let pendingDirection;
    let timer;
    function updateLabels() {
        autoplayButton.textContent = autoplay ? "Autoplay: On" : "Autoplay: Off";
        pauseButton.textContent = paused ? "Resume" : "Pause";
        restartButton.textContent = "Restart";
        stats.textContent = `Score ${state.score} • Pellets ${state.pelletsRemaining} • Turn ${state.turn}/${bootstrap.config.maxTurns} • ${state.frightenedTurnsRemaining > 0 ? `Frightened ${state.frightenedTurnsRemaining}` : state.modePhase} • ${state.lastEvent}`;
    }
    function render() {
        drawBoard(context, state, bootstrap, canvas);
        updateLabels();
    }
    function stopLoop() {
        if (timer !== undefined) {
            window.clearInterval(timer);
            timer = undefined;
        }
    }
    function startLoop() {
        stopLoop();
        if (paused) {
            return;
        }
        timer = window.setInterval(() => {
            if (state.finished) {
                stopLoop();
                render();
                return;
            }
            state = stepGame(state, config, autoplay ? undefined : pendingDirection);
            pendingDirection = undefined;
            render();
        }, bootstrap.config.animationSpeedMs);
    }
    function restart() {
        state = createInitialGameState(bootstrap.map, config);
        pendingDirection = undefined;
        render();
        startLoop();
    }
    autoplayButton.addEventListener("click", () => {
        autoplay = !autoplay;
        render();
    });
    pauseButton.addEventListener("click", () => {
        paused = !paused;
        if (paused) {
            stopLoop();
        }
        else {
            startLoop();
        }
        render();
    });
    restartButton.addEventListener("click", restart);
    window.addEventListener("keydown", (event) => {
        if (event.key === "ArrowUp") {
            pendingDirection = "up";
            event.preventDefault();
        }
        else if (event.key === "ArrowDown") {
            pendingDirection = "down";
            event.preventDefault();
        }
        else if (event.key === "ArrowLeft") {
            pendingDirection = "left";
            event.preventDefault();
        }
        else if (event.key === "ArrowRight") {
            pendingDirection = "right";
            event.preventDefault();
        }
    });
    render();
    startLoop();
}
//# sourceMappingURL=canvasRuntime.js.map