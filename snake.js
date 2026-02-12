const readline = require("readline");

// --- Config ---
const WIDTH = 30;
const HEIGHT = 20;
const TICK_MS = 150;

// --- Colors (ANSI) ---
const RESET = "\x1B[0m";
const PINK = "\x1B[38;5;213m";
const HOT_PINK = "\x1B[38;5;199m";
const LIGHT_PINK = "\x1B[38;5;218m";
const BRIGHT_PINK = "\x1B[38;5;198m";
const PINK_BG = "\x1B[48;5;53m";

// --- Symbols ---
const WALL = `${HOT_PINK}█${RESET}`;
const SNAKE_HEAD = `${BRIGHT_PINK}O${RESET}`;
const SNAKE_BODY = `${PINK}●${RESET}`;
const FOOD = `${LIGHT_PINK}✦${RESET}`;
const EMPTY = " ";

// --- State ---
let snake = [
  { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) },
];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = null;
let score = 0;
let gameOver = false;
let paused = false;

// --- Food ---
function spawnFood() {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  const free = [];
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

// --- Render ---
function render() {
  const lines = [];

  // Top wall
  lines.push(WALL.repeat(WIDTH + 2));

  for (let y = 0; y < HEIGHT; y++) {
    let row = WALL;
    for (let x = 0; x < WIDTH; x++) {
      const isHead = snake[0].x === x && snake[0].y === y;
      const isBody = !isHead && snake.some((s) => s.x === x && s.y === y);
      const isFood = food && food.x === x && food.y === y;

      if (isHead) row += SNAKE_HEAD;
      else if (isBody) row += SNAKE_BODY;
      else if (isFood) row += FOOD;
      else row += EMPTY;
    }
    row += WALL;
    lines.push(row);
  }

  // Bottom wall
  lines.push(WALL.repeat(WIDTH + 2));
  lines.push(`  ${PINK}Wynik: ${score}${RESET}   |   ${LIGHT_PINK}WASD/Strzalki = ruch   Q = wyjscie   P = pauza${RESET}`);

  // Move cursor to top-left and redraw
  process.stdout.write("\x1B[H" + lines.join("\n") + "\n");
}

// --- Game logic ---
function tick() {
  if (gameOver || paused) return;

  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // Wall collision
  if (head.x < 0 || head.x >= WIDTH || head.y < 0 || head.y >= HEIGHT) {
    endGame();
    return;
  }

  // Self collision
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  // Eat food
  if (food && head.x === food.x && head.y === food.y) {
    score += 10;
    food = spawnFood();
  } else {
    snake.pop();
  }

  render();
}

function endGame() {
  gameOver = true;
  render();
  const msg = `\n  ${BRIGHT_PINK}GAME OVER!${RESET}  ${PINK}Wynik: ${score}${RESET}\n  ${LIGHT_PINK}Nacisnij R aby zagrac ponownie, Q aby wyjsc.${RESET}\n`;
  process.stdout.write(msg);
}

function resetGame() {
  snake = [{ x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) }];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameOver = false;
  paused = false;
  food = spawnFood();
  process.stdout.write("\x1B[2J");
  render();
}

// --- Input ---
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on("keypress", (str, key) => {
  if (!key) return;

  // Quit
  if (key.name === "q" || (key.ctrl && key.name === "c")) {
    process.stdout.write("\x1B[2J\x1B[H");
    process.exit();
  }

  // Restart
  if (key.name === "r" && gameOver) {
    resetGame();
    return;
  }

  // Pause
  if (key.name === "p" && !gameOver) {
    paused = !paused;
    if (paused) {
      process.stdout.write(`\n  ${HOT_PINK}-- PAUZA -- (P aby wznowic)${RESET}\n`);
    } else {
      process.stdout.write("\x1B[2J");
      render();
    }
    return;
  }

  // Direction (prevent 180° turn)
  const dirs = {
    up: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  const newDir = dirs[key.name];
  if (newDir) {
    const opposite = newDir.x === -direction.x && newDir.y === -direction.y;
    if (!opposite) {
      nextDirection = newDir;
    }
  }
});

// --- Start ---
process.stdout.write("\x1B[2J\x1B[?25l"); // clear screen, hide cursor
process.on("exit", () => process.stdout.write("\x1B[?25h")); // restore cursor on exit

food = spawnFood();
render();
setInterval(tick, TICK_MS);
