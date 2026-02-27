import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

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
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--cl-window-bg, light-dark(#edeceb, #2e3436));
      font-family: var(--cl-font-family, "DejaVu Sans", sans-serif);
      user-select: none;
    }

    #header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px 8px;
      gap: 8px;
      border-bottom: 1px solid light-dark(#9d9c9b, #555753);
    }

    #face {
      font-size: 18px;
      line-height: 1;
      width: 28px;
      height: 28px;
      border: 1px solid light-dark(#9d9c9b, #555753);
      border-radius: 3px;
      background: var(--cl-button-bg);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
      cursor: default;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;

      &:active {
        background: var(--cl-button-bg-active);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
      }
    }

    #board {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 0;
      padding: 6px;
      flex: 1;
      align-content: start;
      justify-items: center;
    }

    #statusbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 8px;
      font-size: var(--cl-font-size-small, 11px);
      color: light-dark(#555753, #babdb6);
      border-top: 1px solid light-dark(#d3d7cf, #555753);
      min-height: 18px;
    }

    .cell {
      width: 24px;
      height: 24px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      cursor: default;
    }

    .cell.hidden {
      background: linear-gradient(to bottom, light-dark(#fefefe, #4a4a4a), light-dark(#e6e5e4, #3c3c3c));
      border: 1px solid light-dark(#9d9c9b, #555753);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);

      &:hover {
        background: linear-gradient(to bottom, light-dark(#ffffff, #555555), light-dark(#edeceb, #464646));
      }

      &:active {
        background: light-dark(#d4d3d2, #333333);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
      }
    }

    .cell.revealed {
      background: light-dark(#d9d7d5, #3c3c3c);
      border: 1px solid light-dark(#bfbdbb, #4a4a4a);
    }

    .cell.mine {
      background: light-dark(#ff4444, #cc0000);
    }

    .cell.flagged::after {
      content: '⚑';
      color: light-dark(#cc0000, #ef2929);
      font-size: 14px;
    }

    .cell.exploded {
      background: light-dark(#ff0000, #aa0000);
    }

    .game-over #board .cell.hidden {
      pointer-events: none;
    }

    .game-won #board .cell.hidden {
      pointer-events: none;
    }
  `;

  @state() accessor _board: Cell[][] = [];
  @state() accessor _gameState: 'playing' | 'won' | 'lost' = 'playing';
  @state() accessor _time = 0;
  @state() accessor _started = false;

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
    return this._board.flat().filter(c => c.flagged).length;
  }

  get #face() {
    if (this._gameState === 'lost') return '😵';
    if (this._gameState === 'won') return '😎';
    return '🙂';
  }

  #newGame() {
    this.#stopTimer();
    this._time = 0;
    this._started = false;
    this._gameState = 'playing';
    this._board = Array.from({ length: ROWS }, () =>
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
      if (this._board[r][c].mine) continue;
      if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
      this._board[r][c].mine = true;
      placed++;
    }
    // count adjacents
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this._board[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this._board[nr][nc].mine) {
              count++;
            }
          }
        }
        this._board[r][c].adjacent = count;
      }
    }
  }

  #startTimer() {
    if (this.#timer) return;
    this.#timer = setInterval(() => {
      if (this._time < 999) this._time++;
    }, 1000);
  }

  #stopTimer() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  #reveal(r: number, c: number) {
    if (this._gameState !== 'playing') return;
    const cell = this._board[r][c];
    if (cell.revealed || cell.flagged) return;

    if (!this._started) {
      this._started = true;
      this.#placeMines(r, c);
      this.#startTimer();
    }

    cell.revealed = true;

    if (cell.mine) {
      this._gameState = 'lost';
      this.#stopTimer();
      // reveal all mines
      for (const row of this._board) {
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
    const unrevealed = this._board.flat().filter(c => !c.revealed).length;
    if (unrevealed === MINES) {
      this._gameState = 'won';
      this.#stopTimer();
      // auto-flag remaining
      for (const row of this._board) {
        for (const c of row) {
          if (!c.revealed) c.flagged = true;
        }
      }
    }

    this.requestUpdate();
  }

  #flag(r: number, c: number, e: Event) {
    e.preventDefault();
    if (this._gameState !== 'playing') return;
    const cell = this._board[r][c];
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
    const hostClass = this._gameState === 'lost' ? 'game-over'
                    : this._gameState === 'won' ? 'game-won' : '';
    const minutes = String(Math.floor(this._time / 60)).padStart(2, '0');
    const seconds = String(this._time % 60).padStart(2, '0');
    return html`
      <div id="header">
        <button id="face" @click=${() => this.#newGame()}>${this.#face}</button>
      </div>
      <div id="board" class=${hostClass}>
        ${this._board.flatMap((row, r) =>
          row.map((cell, c) => {
            const classes = {
              cell: true,
              hidden: !cell.revealed,
              revealed: cell.revealed && !cell.mine,
              mine: cell.revealed && cell.mine,
              flagged: cell.flagged && !cell.revealed,
              exploded: cell.revealed && cell.mine && this._gameState === 'lost',
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
