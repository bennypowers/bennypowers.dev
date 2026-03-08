import { LitElement, html, nothing, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { appElement } from '../lib/app-registry.js';
import { WMEvent } from '../lib/wm-event.js';
import styles from './gnome2-gnometris.css';

/**
 * Board dimensions from tetris.h: COLUMNS=14, LINES=20
 * (the defaults set in main.cpp).
 */
const COLUMNS = 14;
const LINES = 20;

/**
 * Block definitions from blocks.cpp blockTable: 7 tetromino types,
 * each with 4 rotations of a 4x4 grid. Order matches gnometris:
 * L, J, T, S, Z, I, O.
 */
const BLOCKS: number[][][][] = [
  // L-piece (block 0)
  [
    [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
  // J-piece (block 1)
  [
    [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]],
  ],
  // T-piece (block 2)
  [
    [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
  // S-piece (block 3)
  [
    [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
    [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
  // Z-piece (block 4)
  [
    [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]],
  ],
  // I-piece (block 5)
  [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  // O-piece (block 6)
  [
    [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
  ],
];

/**
 * Score values from scoreframe.cpp scoreLines():
 * 1 line = 40, 2 = 100, 3 = 300, 4 (tetris) = 1200,
 * all multiplied by the current level.
 */
const LINE_SCORES = [0, 40, 100, 300, 1200];

interface Cell {
  color: number; // -1 = empty, 0-6 = piece color index
}

/**
 * Gnometris (Tetris) from gnome-games 2.20. Presents a 14-column
 * by 20-row falling-block puzzle. Pieces are the 7 standard
 * tetrominoes from blocks.cpp. Scoring matches scoreframe.cpp:
 * 1 line = 40*level, 2 = 100*level, 3 = 300*level, 4 = 1200*level.
 * Level advances every 10 lines. A ghost piece shows where the
 * current piece will land. Includes next-piece preview and a
 * score/lines/level sidebar matching the ScoreFrame widget.
 * SHOULD be launched from the Applications > Games menu.
 *
 * @summary Gnometris falling-block puzzle game
 */
@appElement({ width: '700px', height: '870px' })
@customElement('gnome2-gnometris')
export class Gnome2Gnometris extends LitElement {
  static appId = 'gnometris';
  static appLabel = 'Gnometris';
  static appIcon = 'apps/gnome-gnometris';
  static styles = styles;

  @state() accessor #field: Cell[][] = [];
  @state() accessor #score = 0;
  @state() accessor #lines = 0;
  @state() accessor #level = 1;
  @state() accessor #gameState: 'idle' | 'playing' | 'paused' | 'over' = 'idle';

  /** Current falling piece */
  @state() accessor #currentBlock = 0;
  @state() accessor #currentRot = 0;
  @state() accessor #currentColor = 0;
  @state() accessor #posX = 0;
  @state() accessor #posY = 0;

  /** Next piece preview */
  @state() accessor #nextBlock = 0;
  @state() accessor #nextColor = 0;

  #timer: ReturnType<typeof setInterval> | null = null;
  #menubar: HTMLElement | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.#newGame();
    this.#attachMenubar();
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopTimer();
    this.#menubar?.remove();
    this.#menubar = null;
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  /**
   * Attach the Gnometris menubar to the parent gtk2-window.
   * Matches the GtkUIManager from tetris.cpp: Game (New, Pause,
   * End, separator, Quit) and Help (About).
   */
  #attachMenubar() {
    const win = this.closest('gtk2-window');
    if (!win) return;
    const bar = document.createElement('gtk2-menu-bar');
    bar.slot = 'menubar';
    bar.innerHTML = /* html */`
      <gtk2-menu-button label="Game">
        <gtk2-menu-item label="New Game" icon="actions/document-new"></gtk2-menu-item>
        <gtk2-menu-item label="Pause"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Close" icon="actions/window-close"></gtk2-menu-item>
      </gtk2-menu-button>
      <gtk2-menu-button label="Help">
        <gtk2-menu-item label="About"></gtk2-menu-item>
      </gtk2-menu-button>
    `;
    const items = bar.querySelectorAll<HTMLElement>('gtk2-menu-item:not([separator])');
    items[0].addEventListener('click', () => this.#newGame());
    items[1].addEventListener('click', () => this.#togglePause());
    items[2].addEventListener('click', () => {
      const wmId = win.getAttribute('window-url') ?? '';
      win.dispatchEvent(new WMEvent('close', wmId));
    });
    win.appendChild(bar);
    this.#menubar = bar;
  }

  #emptyField(): Cell[][] {
    return Array.from({ length: LINES }, () =>
      Array.from({ length: COLUMNS }, () => ({ color: -1 }))
    );
  }

  #newGame() {
    this.#stopTimer();
    this.#field = this.#emptyField();
    this.#score = 0;
    this.#lines = 0;
    this.#level = 1;
    this.#gameState = 'playing';
    this.#nextBlock = Math.floor(Math.random() * BLOCKS.length);
    this.#nextColor = Math.floor(Math.random() * BLOCKS.length);
    this.#spawnPiece();
    this.#startTimer();
    this.focus();
  }

  #togglePause() {
    if (this.#gameState === 'playing') {
      this.#gameState = 'paused';
      this.#stopTimer();
    } else if (this.#gameState === 'paused') {
      this.#gameState = 'playing';
      this.#startTimer();
    }
  }

  #startTimer() {
    if (this.#timer) return;
    this.#timer = setInterval(() => this.#tick(), this.#speed);
  }

  #stopTimer() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  /**
   * Drop speed from tetris.cpp generateTimer():
   * int intv = (int) round(1000.0 * pow(0.8, level - 1));
   * if (intv <= 10) intv = 10;
   */
  get #speed(): number {
    return Math.max(10, Math.round(1000 * Math.pow(0.8, this.#level - 1)));
  }

  #spawnPiece() {
    this.#currentBlock = this.#nextBlock;
    this.#currentColor = this.#nextColor;
    this.#currentRot = 0;
    this.#posX = Math.floor((COLUMNS - 4) / 2);
    this.#posY = 0;
    this.#nextBlock = Math.floor(Math.random() * BLOCKS.length);
    this.#nextColor = Math.floor(Math.random() * BLOCKS.length);

    if (!this.#canPlace(this.#posX, this.#posY, this.#currentBlock, this.#currentRot)) {
      this.#gameState = 'over';
      this.#stopTimer();
    }
  }

  #canPlace(px: number, py: number, block: number, rot: number): boolean {
    const shape = BLOCKS[block][rot];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const fx = px + c;
        const fy = py + r;
        if (fx < 0 || fx >= COLUMNS || fy >= LINES) return false;
        if (fy >= 0 && this.#field[fy][fx].color !== -1) return false;
      }
    }
    return true;
  }

  #tick() {
    if (this.#gameState !== 'playing') return;
    if (this.#canPlace(this.#posX, this.#posY + 1, this.#currentBlock, this.#currentRot)) {
      this.#posY++;
      this.requestUpdate();
    } else {
      this.#lockPiece();
    }
  }

  #lockPiece() {
    const shape = BLOCKS[this.#currentBlock][this.#currentRot];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const fx = this.#posX + c;
        const fy = this.#posY + r;
        if (fy >= 0 && fy < LINES && fx >= 0 && fx < COLUMNS) {
          this.#field[fy][fx] = { color: this.#currentColor };
        }
      }
    }
    this.#clearLines();
    this.#spawnPiece();
    // Restart timer at possibly new speed
    this.#stopTimer();
    if (this.#gameState === 'playing') this.#startTimer();
  }

  /**
   * Line clearing and scoring from scoreframe.cpp scoreLines()
   * and blockops.cpp checkFullLines(). Full lines are removed,
   * rows above fall down.
   */
  #clearLines() {
    let cleared = 0;
    for (let y = LINES - 1; y >= 0; y--) {
      if (this.#field[y].every(cell => cell.color !== -1)) {
        this.#field.splice(y, 1);
        this.#field.unshift(
          Array.from({ length: COLUMNS }, () => ({ color: -1 }))
        );
        cleared++;
        y++; // re-check this row
      }
    }

    if (cleared > 0) {
      this.#score += (LINE_SCORES[cleared] ?? 0) * this.#level;
      this.#lines += cleared;
      // Level up every 10 lines, matching scoreframe.cpp
      this.#level = 1 + Math.floor(this.#lines / 10);
    }

    // Check if field is completely empty for bonus
    // (scoreLastLineBonus: 10000 * level)
    if (this.#field.every(row => row.every(cell => cell.color === -1))) {
      this.#score += 10000 * this.#level;
    }
  }

  /** Get the Y position where the piece would land (ghost piece) */
  get #ghostY(): number {
    let gy = this.#posY;
    while (this.#canPlace(this.#posX, gy + 1, this.#currentBlock, this.#currentRot)) {
      gy++;
    }
    return gy;
  }

  #onKeyDown = (e: KeyboardEvent) => {
    if (this.#gameState !== 'playing') {
      if (e.key === 'p' || e.key === 'P') {
        this.#togglePause();
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (this.#canPlace(this.#posX - 1, this.#posY, this.#currentBlock, this.#currentRot)) {
          this.#posX--;
          this.requestUpdate();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (this.#canPlace(this.#posX + 1, this.#posY, this.#currentBlock, this.#currentRot)) {
          this.#posX++;
          this.requestUpdate();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (this.#canPlace(this.#posX, this.#posY + 1, this.#currentBlock, this.#currentRot)) {
          this.#posY++;
          this.requestUpdate();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.#tryRotate();
        break;
      case ' ':
        e.preventDefault();
        this.#hardDrop();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        this.#togglePause();
        break;
    }
  };

  #tryRotate() {
    const newRot = (this.#currentRot + 1) % 4;
    if (this.#canPlace(this.#posX, this.#posY, this.#currentBlock, newRot)) {
      this.#currentRot = newRot;
      this.requestUpdate();
    }
  }

  /**
   * Hard drop from blockops.cpp dropBlock(): instantly moves the
   * piece to its landing position.
   */
  #hardDrop() {
    this.#posY = this.#ghostY;
    this.#lockPiece();
  }

  /**
   * Build the composite field for rendering: locked cells + current
   * piece + ghost piece.
   */
  #getDisplayField(): { color: number; falling: boolean; ghost: boolean }[][] {
    const display = this.#field.map(row =>
      row.map(cell => ({ color: cell.color, falling: false, ghost: false }))
    );

    if (this.#gameState !== 'playing' && this.#gameState !== 'paused') return display;

    const shape = BLOCKS[this.#currentBlock][this.#currentRot];
    const ghostY = this.#ghostY;

    // Draw ghost piece
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const fx = this.#posX + c;
        const fy = ghostY + r;
        if (fy >= 0 && fy < LINES && fx >= 0 && fx < COLUMNS && display[fy][fx].color === -1) {
          display[fy][fx] = { color: this.#currentColor, falling: false, ghost: true };
        }
      }
    }

    // Draw current piece (overwrites ghost where overlapping)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const fx = this.#posX + c;
        const fy = this.#posY + r;
        if (fy >= 0 && fy < LINES && fx >= 0 && fx < COLUMNS) {
          display[fy][fx] = { color: this.#currentColor, falling: true, ghost: false };
        }
      }
    }

    return display;
  }

  /** Render the 4x4 next-piece preview matching preview.cpp */
  #renderPreview() {
    const shape = BLOCKS[this.#nextBlock][0];
    return html`
      <div id="preview">
        ${shape.flatMap((row, r) =>
          row.map((cell, c) => html`
            <div class=${classMap({
              cell: true,
              filled: cell === 1,
              [`color-${this.#nextColor}`]: cell === 1,
            })} aria-hidden="true"></div>
          `)
        )}
      </div>
    `;
  }

  render() {
    const display = this.#getDisplayField();
    return html`
      <div id="content">
        <div id="field-wrapper">
          <div id="board-container">
            <div id="board"
                 tabindex="0"
                 role="img"
                 aria-label="Gnometris game board">
              ${display.flatMap((row, y) =>
                row.map((cell, x) => html`
                  <div class=${classMap({
                    cell: true,
                    filled: cell.color !== -1 && !cell.ghost,
                    ghost: cell.ghost,
                    [`color-${cell.color}`]: cell.color !== -1,
                  })}></div>
                `)
              )}
            </div>
            ${this.#gameState === 'paused' ? html`
              <div class="paused-overlay">
                <span class="paused-text">Paused</span>
              </div>
            ` : nothing}
            ${this.#gameState === 'over' ? html`
              <div class="game-over-overlay">
                <div class="game-over-dialog">
                  <h3>Game Over</h3>
                  <p>Score: ${this.#score}</p>
                  <button @click=${() => this.#newGame()}>New Game</button>
                </div>
              </div>
            ` : nothing}
          </div>
        </div>
        <div id="sidebar">
          <div id="preview-frame">
            <span id="preview-label">Next</span>
            ${this.#renderPreview()}
          </div>
          <div id="score-frame">
            <div class="score-row">
              <span class="score-label">Score:</span>
              <span class="score-value">${this.#score}</span>
            </div>
            <div class="score-row">
              <span class="score-label">Lines:</span>
              <span class="score-value">${this.#lines}</span>
            </div>
            <div class="score-row">
              <span class="score-label">Level:</span>
              <span class="score-value">${this.#level}</span>
            </div>
          </div>
        </div>
      </div>
      <div id="statusbar">
        <span>${this.#gameState === 'paused' ? 'Paused' : this.#gameState === 'over' ? 'Game Over' : ''}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-gnometris': Gnome2Gnometris;
  }
}
