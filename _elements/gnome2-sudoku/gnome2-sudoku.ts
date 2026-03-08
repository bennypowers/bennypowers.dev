import { LitElement, html, nothing, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { appElement } from '../lib/app-registry.js';
import { WMEvent } from '../lib/wm-event.js';
import styles from './gnome2-sudoku.css';

type Difficulty = 'easy' | 'medium' | 'hard';

/** Number of cells to remove per difficulty, matching gnome-sudoku ranges */
const CLUES_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 38,
  medium: 30,
  hard: 24,
};

/**
 * Generate a complete, valid solved Sudoku board using backtracking.
 * Fills column-by-column with shuffled candidates, matching the
 * SudokuSolver.solve() approach from sudoku.py.
 */
function generateSolvedBoard(): number[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  function isValid(board: number[][], row: number, col: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) return false;
      if (board[i][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  function fill(pos: number): boolean {
    if (pos === 81) return true;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Shuffle for randomness
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    for (const num of nums) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        if (fill(pos + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  fill(0);
  return board;
}

/**
 * Remove cells from a solved board to create a puzzle.
 * Uses symmetric removal matching gnome-sudoku's
 * SudokuGenerator.make_symmetric_puzzle() approach.
 */
function makePuzzle(solved: number[][], difficulty: Difficulty): { puzzle: number[][]; solution: number[][] } {
  const solution = solved.map(row => [...row]);
  const puzzle = solved.map(row => [...row]);
  const clues = CLUES_BY_DIFFICULTY[difficulty];
  const totalToRemove = 81 - clues;

  const coords: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      coords.push([r, c]);
    }
  }

  // Shuffle and remove symmetrically
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }

  let removed = 0;
  for (const [r, c] of coords) {
    if (removed >= totalToRemove) break;
    const symR = 8 - r;
    const symC = 8 - c;

    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed++;
    }
    if (removed < totalToRemove && puzzle[symR][symC] !== 0) {
      puzzle[symR][symC] = 0;
      removed++;
    }
  }

  return { puzzle, solution };
}

/**
 * Check if a value conflicts with any other value in its row, column,
 * or 3x3 box. Matches the ConflictError detection from sudoku.py's
 * SudokuGrid.add() method which checks TYPE_ROW, TYPE_COLUMN, TYPE_BOX.
 */
function hasConflict(board: number[][], row: number, col: number, value: number): boolean {
  if (value === 0) return false;
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === value) return true;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === value) return true;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (!(r === row && c === col) && board[r][c] === value) return true;
    }
  }
  return false;
}

/**
 * A Sudoku puzzle game modeled after GNOME Sudoku from gnome-games
 * 2.20. Presents a 9x9 grid divided into 3x3 boxes. The player fills
 * empty cells with digits 1-9 so that each row, column, and box
 * contains each digit exactly once. Highlights conflicts in red and
 * detects puzzle completion. Supports Easy, Medium, and Hard
 * difficulties matching the original's DifficultyRating ranges.
 * SHOULD be launched from the Applications > Games menu.
 *
 * @summary GNOME Sudoku number puzzle game
 *
 * @fires puzzle-finished - When the puzzle is correctly completed
 */
@appElement({ width: '420px', height: '500px' })
@customElement('gnome2-sudoku')
export class Gnome2Sudoku extends LitElement {
  static appId = 'sudoku';
  static appLabel = 'Sudoku';
  static appIcon = 'apps/gnome-sudoku';
  static styles = styles;

  /** The current board state (0 = empty) */
  @state() accessor #board: number[][] = [];

  /** The puzzle's solution for win checking */
  @state() accessor #solution: number[][] = [];

  /** Which cells are pre-filled (given) clues */
  @state() accessor #given: boolean[][] = [];

  /** Currently selected cell [row, col] or null */
  @state() accessor #selected: [number, number] | null = null;

  /** Current difficulty level */
  @state() accessor #difficulty: Difficulty = 'easy';

  /** Game state */
  @state() accessor #gameState: 'playing' | 'won' = 'playing';

  /** Timer elapsed seconds */
  @state() accessor #time = 0;

  #timer: ReturnType<typeof setInterval> | null = null;
  #menubar: HTMLElement | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.#newGame();
    this.#attachMenubar();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (isServer) return;
    this.#stopTimer();
    this.#menubar?.remove();
    this.#menubar = null;
  }

  /**
   * Attach the Sudoku menubar to the parent gtk2-window.
   * Matches the GtkUIManager menubar from gnome_sudoku.py:
   * Game (New, separator, Close) and Help (About).
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
        <gtk2-menu-item label="About" icon="actions/help-about"></gtk2-menu-item>
      </gtk2-menu-button>
    `;
    const items = bar.querySelectorAll<HTMLElement>('gtk2-menu-item:not([separator])');
    items[0].addEventListener('click', () => this.#promptNewGame());  // New Game
    items[1].addEventListener('click', () => {                         // Close
      const wmId = win.getAttribute('window-url') ?? '';
      win.dispatchEvent(new WMEvent('close', wmId));
    });
    win.appendChild(bar);
    this.#menubar = bar;
  }

  #newGame(difficulty: Difficulty = this.#difficulty) {
    this.#stopTimer();
    this.#difficulty = difficulty;
    this.#time = 0;
    this.#gameState = 'playing';
    this.#selected = null;

    const solved = generateSolvedBoard();
    const { puzzle, solution } = makePuzzle(solved, difficulty);

    this.#board = puzzle;
    this.#solution = solution;
    this.#given = puzzle.map(row => row.map(cell => cell !== 0));

    this.#startTimer();
  }

  /**
   * Prompt with a simple difficulty cycle for new game.
   * In the original gnome-sudoku, this opens a NewGameSelector dialog.
   * We cycle through difficulties on each new game request.
   */
  #promptNewGame() {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const currentIdx = difficulties.indexOf(this.#difficulty);
    const nextIdx = (currentIdx + 1) % difficulties.length;
    this.#newGame(difficulties[nextIdx]);
  }

  #startTimer() {
    if (this.#timer) return;
    this.#timer = setInterval(() => {
      this.#time++;
    }, 1000);
  }

  #stopTimer() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  #selectCell(row: number, col: number) {
    if (this.#gameState !== 'playing') return;
    this.#selected = [row, col];
  }

  #handleKeydown(e: KeyboardEvent) {
    if (this.#gameState !== 'playing') return;
    if (!this.#selected) return;
    const [row, col] = this.#selected;

    // Number input (1-9 or Delete/Backspace to clear)
    if (e.key >= '1' && e.key <= '9') {
      if (this.#given[row][col]) return;
      this.#board[row][col] = parseInt(e.key);
      this.requestUpdate();
      this.#checkWin();
      return;
    }
    if (e.key === '0' || e.key === 'Delete' || e.key === 'Backspace') {
      if (this.#given[row][col]) return;
      this.#board[row][col] = 0;
      this.requestUpdate();
      return;
    }

    // Arrow key navigation
    let newRow = row;
    let newCol = col;
    switch (e.key) {
      case 'ArrowUp':    newRow = Math.max(0, row - 1); break;
      case 'ArrowDown':  newRow = Math.min(8, row + 1); break;
      case 'ArrowLeft':  newCol = Math.max(0, col - 1); break;
      case 'ArrowRight': newCol = Math.min(8, col + 1); break;
      default: return;
    }
    e.preventDefault();
    this.#selected = [newRow, newCol];
  }

  /**
   * Check if the puzzle is completely and correctly filled.
   * Matches gnome_sudoku.py's you_win_callback which fires
   * when the puzzle-finished signal is emitted from gsudoku.py.
   */
  #checkWin() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.#board[r][c] !== this.#solution[r][c]) return;
      }
    }
    this.#gameState = 'won';
    this.#stopTimer();
    this.dispatchEvent(new Event('puzzle-finished'));
  }

  /**
   * Determine if a cell is in the same row, column, or box
   * as the selected cell, for highlight rendering matching
   * gsudoku.py's toggle_highlight feature.
   */
  #isHighlighted(row: number, col: number): boolean {
    if (!this.#selected) return false;
    const [selRow, selCol] = this.#selected;
    if (row === selRow || col === selCol) return true;
    const boxRow = Math.floor(selRow / 3) * 3;
    const boxCol = Math.floor(selCol / 3) * 3;
    return row >= boxRow && row < boxRow + 3 && col >= boxCol && col < boxCol + 3;
  }

  render() {
    const minutes = String(Math.floor(this.#time / 60)).padStart(2, '0');
    const seconds = String(this.#time % 60).padStart(2, '0');
    const diffLabel = this.#difficulty.charAt(0).toUpperCase() + this.#difficulty.slice(1);

    return html`
      <div id="board"
           role="grid"
           tabindex="0"
           @keydown=${(e: KeyboardEvent) => this.#handleKeydown(e)}>
        ${this.#board.map((row, r) => row.map((value, c) => {
          const isGiven = this.#given[r]?.[c] ?? false;
          const isSelected = this.#selected?.[0] === r && this.#selected?.[1] === c;
          const isConflict = value !== 0 && hasConflict(this.#board, r, c, value);
          const isHighlighted = this.#isHighlighted(r, c);
          const classes = {
            cell: true,
            given: isGiven,
            editable: !isGiven,
            selected: isSelected,
            conflict: isConflict,
            highlighted: isHighlighted && !isSelected,
            'box-right': c === 2 || c === 5,
            'box-bottom': r === 2 || r === 5,
            'col-0': c === 0,
            'col-8': c === 8,
            'row-0': r === 0,
            'row-8': r === 8,
          };
          const label = `Row ${r + 1}, Column ${c + 1}${value ? `, ${value}` : ', empty'}${isGiven ? ', given' : ''}`;
          return html`
            <div class=${classMap(classes)}
                 role="gridcell"
                 aria-label=${label}
                 @click=${() => this.#selectCell(r, c)}>
              ${value || ''}
            </div>
          `;
        }))}
      </div>
      ${this.#gameState === 'won' ? html`
        <div class="win-overlay">
          <div class="win-dialog">
            <h3>Congratulations!</h3>
            <p>You completed the ${diffLabel} puzzle in ${minutes}:${seconds}</p>
            <button @click=${() => this.#newGame()}>New Game</button>
          </div>
        </div>
      ` : nothing}
      <div id="statusbar">
        <span>${diffLabel}</span>
        <span>${minutes}:${seconds}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-sudoku': Gnome2Sudoku;
  }
}
