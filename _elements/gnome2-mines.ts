import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import styles from './gnome2-mines.css';

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

const ROWS = 8;
const COLS = 8;
const MINES = 10;

const ADJACENT_COLORS: Record<number, string> = {
  1: '#0000ff',
  2: '#00a000',
  3: '#ff0000',
  4: '#00007f',
  5: '#a00000',
  6: '#00ffff',
  7: '#a000a0',
  8: '#000000',
};

@customElement('gnome2-mines')
export class Gnome2Mines extends LitElement {
  static styles = styles;

  @state() accessor #board: Cell[][] = [];
  @state() accessor #gameState: 'playing' | 'won' | 'lost' = 'playing';
  @state() accessor #time = 0;
  @state() accessor #started = false;

  #timer: ReturnType<typeof setInterval> | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.#newGame();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopTimer();
  }

  get #flagCount() {
    return this.#board.flat().filter(c => c.flagged).length;
  }

  get #face() {
    if (this.#gameState === 'lost') return '😵';
    if (this.#gameState === 'won') return '😎';
    return '🙂';
  }

  #newGame() {
    this.#stopTimer();
    this.#time = 0;
    this.#started = false;
    this.#gameState = 'playing';
    this.#board = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );
  }

  #placeMines(excludeRow: number, excludeCol: number) {
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (this.#board[r][c].mine) continue;
      if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
      this.#board[r][c].mine = true;
      placed++;
    }
    // count adjacents
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.#board[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this.#board[nr][nc].mine) {
              count++;
            }
          }
        }
        this.#board[r][c].adjacent = count;
      }
    }
  }

  #startTimer() {
    if (this.#timer) return;
    this.#timer = setInterval(() => {
      if (this.#time < 999) this.#time++;
    }, 1000);
  }

  #stopTimer() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  #reveal(r: number, c: number) {
    if (this.#gameState !== 'playing') return;
    const cell = this.#board[r][c];
    if (cell.revealed || cell.flagged) return;

    if (!this.#started) {
      this.#started = true;
      this.#placeMines(r, c);
      this.#startTimer();
    }

    cell.revealed = true;

    if (cell.mine) {
      this.#gameState = 'lost';
      this.#stopTimer();
      // reveal all mines
      for (const row of this.#board) {
        for (const c of row) {
          if (c.mine) c.revealed = true;
        }
      }
      this.requestUpdate();
      return;
    }

    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            this.#reveal(nr, nc);
          }
        }
      }
    }

    // check win
    const unrevealed = this.#board.flat().filter(c => !c.revealed).length;
    if (unrevealed === MINES) {
      this.#gameState = 'won';
      this.#stopTimer();
      // auto-flag remaining
      for (const row of this.#board) {
        for (const c of row) {
          if (!c.revealed) c.flagged = true;
        }
      }
    }

    this.requestUpdate();
  }

  #flag(r: number, c: number, e: Event) {
    e.preventDefault();
    if (this.#gameState !== 'playing') return;
    const cell = this.#board[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    this.requestUpdate();
  }

  #cellContent(cell: Cell, r: number, c: number) {
    if (cell.flagged && !cell.revealed) return '';
    if (!cell.revealed) return '';
    if (cell.mine) return '💣';
    if (cell.adjacent === 0) return '';
    return String(cell.adjacent);
  }

  #cellColor(cell: Cell) {
    if (!cell.revealed || cell.mine || cell.adjacent === 0) return '';
    return ADJACENT_COLORS[cell.adjacent] ?? '';
  }

  render() {
    const hostClass = this.#gameState === 'lost' ? 'game-over'
                    : this.#gameState === 'won' ? 'game-won' : '';
    const minutes = String(Math.floor(this.#time / 60)).padStart(2, '0');
    const seconds = String(this.#time % 60).padStart(2, '0');
    return html`
      <div id="header">
        <button id="face" @click=${() => this.#newGame()}>${this.#face}</button>
      </div>
      <div id="board" class=${hostClass}>
        ${this.#board.flatMap((row, r) =>
          row.map((cell, c) => {
            const classes = {
              cell: true,
              hidden: !cell.revealed,
              revealed: cell.revealed && !cell.mine,
              mine: cell.revealed && cell.mine,
              flagged: cell.flagged && !cell.revealed,
              exploded: cell.revealed && cell.mine && this.#gameState === 'lost',
            };
            return html`
              <div class=${classMap(classes)}
                   style=${cell.revealed && cell.adjacent ? `color: ${this.#cellColor(cell)}` : ''}
                   @click=${() => this.#reveal(r, c)}
                   @contextmenu=${(e: Event) => this.#flag(r, c, e)}>
                ${this.#cellContent(cell, r, c)}
              </div>
            `;
          })
        )}
      </div>
      <div id="statusbar">
        <span>Flags: ${this.#flagCount}/${MINES}</span>
        <span>Time: ${minutes}:${seconds}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-mines': Gnome2Mines;
  }
}
