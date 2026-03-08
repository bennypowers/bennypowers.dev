import { LitElement, html, nothing, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { appElement } from '../lib/app-registry.js';
import { WMEvent } from '../lib/wm-event.js';
import styles from './gnome2-same-gnome.css';

/**
 * Board dimensions and colour counts from same-gnome.c board_sizes.
 * Small: 15x10 with 3 colours (the default).
 */
const BOARD_WIDTH = 15;
const BOARD_HEIGHT = 10;
const NUM_COLOURS = 3;

/** Blank cell marker matching game.h NONE = -1 */
const NONE = -1;

/**
 * Tango palette colours for the three ball types, chosen to match the
 * GNOME 2.20 "planets" theme hues (blue, red, green).
 */
const BALL_COLOURS = [
  { bg: '#3465a4', border: '#204a87', highlight: '#729fcf' }, // blue
  { bg: '#cc0000', border: '#a40000', highlight: '#ef2929' }, // red
  { bg: '#4e9a06', border: '#346004', highlight: '#73d216' }, // green
];

/**
 * Score calculation from game.c calculate_score:
 * clusters of fewer than 3 score 0, otherwise (n-2)^2.
 */
function calculateScore(n: number): number {
  if (n < 3) return 0;
  return (n - 2) ** 2;
}

/**
 * Same GNOME ball-clearing puzzle from gnome-games 2.20. Presents a
 * 15x10 grid of colored balls. Hover to highlight a connected cluster
 * of same-colored balls; click to remove the cluster. Remaining balls
 * fall down under gravity and empty columns collapse left. Score is
 * awarded as (n-2)^2 where n is the cluster size (minimum 3). A 1000
 * point bonus is awarded for clearing the entire board.
 * SHOULD be launched from the Applications > Games menu.
 *
 * @summary Same GNOME ball-clearing puzzle game
 */
@appElement({ width: '450px', height: '350px' })
@customElement('gnome2-same-gnome')
export class Gnome2SameGnome extends LitElement {
  static appId = 'same-gnome';
  static appLabel = 'Same GNOME';
  static appIcon = 'apps/gnome-samegnome';
  static styles = styles;

  /** The board is stored column-major: board[x][y], y=0 is top. */
  @state() accessor #board: number[][] = [];
  @state() accessor #score = 0;
  @state() accessor #gameOver = false;
  @state() accessor #selected: Set<string> = new Set();
  @state() accessor #message = '';

  #menubar: HTMLElement | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.#newGame();
    this.#attachMenubar();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#menubar?.remove();
    this.#menubar = null;
  }

  /**
   * Attach the Same GNOME menubar to the parent gtk2-window.
   * Matches the GtkUIManager definition from ui.c: Game menu
   * (New Game, separator, Close) and Help menu (About).
   */
  #attachMenubar() {
    const win = this.closest('gtk2-window');
    if (!win) return;
    const bar = document.createElement('gtk2-menu-bar');
    bar.slot = 'menubar';
    bar.innerHTML = /* html */`
      <gtk2-menu-button label="Game">
        <gtk2-menu-item label="New Game" icon="actions/document-new"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Close" icon="actions/window-close"></gtk2-menu-item>
      </gtk2-menu-button>
      <gtk2-menu-button label="Help">
        <gtk2-menu-item label="About"></gtk2-menu-item>
      </gtk2-menu-button>
    `;
    const items = bar.querySelectorAll<HTMLElement>('gtk2-menu-item:not([separator])');
    items[0].addEventListener('click', () => this.#newGame());
    items[1].addEventListener('click', () => {
      const wmId = win.getAttribute('window-url') ?? '';
      win.dispatchEvent(new WMEvent('close', wmId));
    });
    win.appendChild(bar);
    this.#menubar = bar;
  }

  /**
   * Initialize a new board matching new_game() from game.c:
   * distribute colours evenly then Fisher-Yates shuffle.
   */
  #newGame() {
    this.#score = 0;
    this.#gameOver = false;
    this.#selected = new Set();
    this.#message = '';

    // Build a flat array of evenly distributed colours, then shuffle
    const total = BOARD_WIDTH * BOARD_HEIGHT;
    const flat: number[] = [];
    for (let i = 0; i < total; i++) {
      flat.push(i % NUM_COLOURS);
    }
    // Fisher-Yates shuffle matching game.c randomisation
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }

    // Store column-major: board[x][y], y=0 is top row
    this.#board = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const col: number[] = [];
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        col.push(flat[y * BOARD_WIDTH + x]);
      }
      this.#board.push(col);
    }
  }

  /**
   * Flood-fill to find connected component of same-coloured cells.
   * Matches find_connected_component() from game.c using orthogonal
   * adjacency (up/down/left/right).
   */
  #findCluster(startX: number, startY: number): Array<[number, number]> {
    const colour = this.#board[startX][startY];
    if (colour === NONE) return [];

    const visited = new Set<string>();
    const cluster: Array<[number, number]> = [];
    const stack: Array<[number, number]> = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) continue;
      if (this.#board[x][y] !== colour) continue;

      cluster.push([x, y]);
      stack.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
    }

    return cluster;
  }

  /**
   * Handle mouse hover: highlight the cluster under the pointer.
   * Matches the select_cells() / mouse_movement_cb() pattern from
   * input.c where hovering highlights the connected component.
   */
  #onHover(x: number, y: number) {
    if (this.#gameOver) return;
    if (this.#board[x][y] === NONE) {
      this.#selected = new Set();
      this.#message = '';
      return;
    }

    const cluster = this.#findCluster(x, y);
    if (cluster.length < 2) {
      this.#selected = new Set();
      this.#message = '';
      return;
    }

    this.#selected = new Set(cluster.map(([cx, cy]) => `${cx},${cy}`));

    // Status message matching set_message() from ui.c
    const pts = calculateScore(cluster.length);
    if (pts === 0) {
      this.#message = 'No points';
    } else {
      this.#message = `${pts} point${pts !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Handle click: remove the highlighted cluster and apply gravity
   * and column collapse. Matches destroy_balls(), mark_falling_balls(),
   * and mark_shifting_balls() from game.c.
   */
  #onClick(x: number, y: number) {
    if (this.#gameOver) return;
    if (this.#board[x][y] === NONE) return;

    const cluster = this.#findCluster(x, y);
    // From game.c destroy_balls: count must be > 1
    if (cluster.length <= 1) return;

    // Remove the cluster
    this.#score += calculateScore(cluster.length);
    for (const [cx, cy] of cluster) {
      this.#board[cx][cy] = NONE;
    }

    // Gravity: balls fall down within each column (mark_falling_balls)
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const filled = this.#board[col].filter(c => c !== NONE);
      const empty = BOARD_HEIGHT - filled.length;
      this.#board[col] = [
        ...Array.from<number>({ length: empty }).fill(NONE),
        ...filled,
      ];
    }

    // Collapse empty columns left (mark_shifting_balls)
    // A column is empty if its bottom cell is NONE
    const nonEmpty = this.#board.filter(col => col[BOARD_HEIGHT - 1] !== NONE);
    const emptyCount = BOARD_WIDTH - nonEmpty.length;
    this.#board = [
      ...nonEmpty,
      ...Array.from({ length: emptyCount }, () =>
        Array.from<number>({ length: BOARD_HEIGHT }).fill(NONE)
      ),
    ];

    this.#selected = new Set();

    // Re-highlight whatever is under the cursor after removal
    if (x < BOARD_WIDTH && y < BOARD_HEIGHT && this.#board[x]?.[y] !== NONE) {
      this.#onHover(x, y);
    } else {
      this.#message = '';
    }

    // End-of-game check matching end_of_game_check() from game.c
    this.#checkGameOver();

    this.requestUpdate();
  }

  /**
   * Check if the board is cleared (1000pt bonus) or if no moves
   * remain. Matches end_of_game_check() from game.c.
   */
  #checkGameOver() {
    // Board cleared: bottom-left cell is NONE
    if (this.#board[0][BOARD_HEIGHT - 1] === NONE) {
      this.#score += 1000;
      this.#message = '1000 point bonus for clearing the board!';
      this.#gameOver = true;
      return;
    }

    // Check for any adjacent same-coloured pair (horizontal)
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        const c = this.#board[x][y];
        if (c !== NONE && c === this.#board[x + 1][y]) return;
      }
    }

    // Check for any adjacent same-coloured pair (vertical)
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT - 1; y++) {
        const c = this.#board[x][y];
        if (c !== NONE && c === this.#board[x][y + 1]) return;
      }
    }

    this.#gameOver = true;
    this.#message = 'Game over!';
  }

  #onMouseLeave() {
    this.#selected = new Set();
    if (!this.#gameOver) {
      this.#message = '';
    }
  }

  render() {
    return html`
      <div id="board"
           role="grid"
           @mouseleave=${() => this.#onMouseLeave()}>
        ${this.#board.map((col, x) => html`
          <div class="column" role="row">
            ${col.map((colour, y) => {
              const key = `${x},${y}`;
              const isEmpty = colour === NONE;
              const isSelected = this.#selected.has(key);
              const ball = BALL_COLOURS[colour];
              const classes = {
                cell: true,
                empty: isEmpty,
                selected: isSelected,
              };
              return html`
                <div class=${classMap(classes)}
                     role="gridcell"
                     aria-label=${isEmpty ? `Empty cell` : `Ball at column ${x + 1}, row ${y + 1}`}
                     @mouseenter=${isEmpty ? nothing : () => this.#onHover(x, y)}
                     @click=${isEmpty ? nothing : () => this.#onClick(x, y)}>
                  ${isEmpty ? nothing : html`
                    <div class="ball"
                         style="--_ball-bg: ${ball.bg}; --_ball-border: ${ball.border}; --_ball-highlight: ${ball.highlight}">
                    </div>
                  `}
                </div>
              `;
            })}
          </div>
        `)}
      </div>
      <div id="statusbar">
        <span id="message">${this.#message}</span>
        <span id="score">Score: ${this.#score}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-same-gnome': Gnome2SameGnome;
  }
}
