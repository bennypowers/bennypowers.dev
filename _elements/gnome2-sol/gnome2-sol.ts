import { LitElement, html, nothing, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { appElement } from '../lib/app-registry.js';
import { WMEvent } from '../lib/wm-event.js';
import styles from './gnome2-sol.css';

// Card encoding: matches games-card-common.h bit layout
// Suits: 0=clubs, 1=diamonds, 2=hearts, 3=spades
const CLUBS = 0;
const DIAMONDS = 1;
const HEARTS = 2;
const SPADES = 3;

interface Card {
  suit: number;
  rank: number; // 1=Ace .. 13=King
  faceUp: boolean;
}

/** Slot types matching klondike.scm layout */
const STOCK = 0;
const WASTE = 1;
const FOUNDATIONS = [2, 3, 4, 5];
const TABLEAU = [6, 7, 8, 9, 10, 11, 12];

/*
 * Layout constants derived from board.c:
 * - Card aspect ratio: 79:123 from bonded.svg cell size
 * - CARD_SLOT_PROP = 0.8 (card takes 80% of slot step)
 * - Board grid: 7 columns x 3.1 rows (from klondike.scm new-game return)
 * - CASCADE: pixeldy computed from expansion delta in slot_update_geometry
 */
const CARD_WIDTH = 65;
const CARD_HEIGHT = 101; // 65 * 123/79 ≈ 101
const SLOT_STEP = Math.round(CARD_WIDTH / 0.8); // 81
const CARD_OFFSET = Math.round((SLOT_STEP - CARD_WIDTH) / 2); // xoffset/yoffset
const CASCADE_OFFSET = 17;
const CASCADE_OFFSET_DOWN = 4;

/** Maximum redeals for single-card deal (from klondike.scm) */
const MAX_REDEAL = 2;

function isRed(suit: number): boolean {
  return suit === DIAMONDS || suit === HEARTS;
}

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck;
}

function shuffle(deck: Card[]): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

/**
 * Compute the bonded.svg sprite background-position for a card face.
 * The sprite is a 13×5 grid where each cell is one card width/height.
 * Rank 1 (Ace) is column 0, rank 13 (King) is column 12.
 * Suits are rows: 0=clubs, 1=diamonds, 2=hearts, 3=spades.
 */
function cardSpritePosition(card: Card): string {
  const col = card.rank - 1;
  const row = card.suit;
  return `calc(-${col} * var(--_card-width)) calc(-${row} * var(--_card-height))`;
}

interface DragState {
  cards: Card[];
  sourceSlot: number;
  sourceIndex: number;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
}

/**
 * Klondike solitaire modeled after AisleRiot (sol) from gnome-games
 * 2.20. Renders cards using the bonded.svg sprite sheet from
 * libgames-support and tiles the baize.png background from the
 * aisleriot source. Implements standard Klondike rules with
 * single-card deals, two redeals, drag-and-drop card movement,
 * and double-click auto-play to foundations.
 * SHOULD be launched from the Applications > Games menu.
 *
 * @summary AisleRiot Klondike solitaire card game
 *
 * @fires game-won - When all four foundations are complete
 */
@appElement({ width: '600px', height: '440px' })
@customElement('gnome2-sol')
export class Gnome2Sol extends LitElement {
  static appId = 'sol';
  static appLabel = 'AisleRiot';
  static appIcon = 'apps/gnome-aisleriot';
  static styles = styles;

  @state() accessor #slots: Card[][] = [];
  @state() accessor #gameState: 'playing' | 'won' = 'playing';
  @state() accessor #redeals = 0;
  @state() accessor #score = 0;
  @state() accessor #drag: DragState | null = null;
  @state() accessor #dropTarget: number | null = null;

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
   * Attach the AisleRiot menubar to the parent gtk2-window.
   * Matches the GtkUIManager menubar definition in window.c:
   * Game (New, Restart, Close), Control (Undo, Redo, Hint).
   */
  #attachMenubar() {
    const win = this.closest('gtk2-window');
    if (!win) return;
    const bar = document.createElement('gtk2-menu-bar');
    bar.slot = 'menubar';
    bar.innerHTML = /* html */`
      <gtk2-menu-button label="Game">
        <gtk2-menu-item label="New Game" icon="actions/document-new"></gtk2-menu-item>
        <gtk2-menu-item label="Restart" icon="actions/view-refresh"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Close" icon="actions/window-close"></gtk2-menu-item>
      </gtk2-menu-button>
      <gtk2-menu-button label="Control">
        <gtk2-menu-item label="Undo Move" icon="actions/edit-undo"></gtk2-menu-item>
        <gtk2-menu-item label="Redo Move" icon="actions/edit-redo"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Hint"></gtk2-menu-item>
      </gtk2-menu-button>
    `;
    // Wire up menu actions matching window.c callbacks
    const items = bar.querySelectorAll<HTMLElement>('gtk2-menu-item:not([separator])');
    items[0].addEventListener('click', () => this.#newGame()); // New Game
    items[1].addEventListener('click', () => this.#newGame()); // Restart
    items[2].addEventListener('click', () => {                 // Close
      const wmId = win.getAttribute('window-url') ?? '';
      win.dispatchEvent(new WMEvent('close', wmId));
    });
    win.appendChild(bar);
    this.#menubar = bar;
  }

  #newGame() {
    this.#gameState = 'playing';
    this.#redeals = 0;
    this.#score = 0;
    this.#drag = null;
    this.#dropTarget = null;

    // Initialize 13 slots (0=stock, 1=waste, 2-5=foundations, 6-12=tableau)
    this.#slots = Array.from({ length: 13 }, () => []);

    const deck = makeDeck();
    shuffle(deck);

    // Deal tableau per klondike.scm deal-tableau: column i gets i+1 cards,
    // then flip-top-card makes the top card face up
    let cardIndex = 0;
    for (let col = 0; col < 7; col++) {
      const slotIdx = TABLEAU[col];
      for (let row = 0; row <= col; row++) {
        const card = deck[cardIndex++];
        card.faceUp = row === col;
        this.#slots[slotIdx].push(card);
      }
    }

    // Remaining cards go to stock (face down)
    while (cardIndex < deck.length) {
      this.#slots[STOCK].push(deck[cardIndex++]);
    }
  }

  /**
   * Click stock to deal or recycle. Matches button-clicked in
   * klondike.scm: (flip-stock stock waste max-redeal 1)
   */
  #clickStock() {
    if (this.#gameState !== 'playing') return;
    const stock = this.#slots[STOCK];
    const waste = this.#slots[WASTE];

    if (stock.length > 0) {
      const card = stock.pop()!;
      card.faceUp = true;
      waste.push(card);
      this.requestUpdate();
    } else if (this.#redeals < MAX_REDEAL) {
      while (waste.length > 0) {
        const card = waste.pop()!;
        card.faceUp = false;
        stock.push(card);
      }
      this.#redeals++;
      this.requestUpdate();
    }
  }

  /**
   * Drop validation matching droppable? in klondike.scm:
   * - Foundation: single card, ace on empty, else same suit and rank+1
   * - Tableau: king on empty, else alternating color and rank-1
   */
  #canDrop(cards: Card[], targetSlot: number): boolean {
    const target = this.#slots[targetSlot];
    const bottomCard = cards[0];

    if (FOUNDATIONS.includes(targetSlot)) {
      if (cards.length !== 1) return false;
      if (target.length === 0) return bottomCard.rank === 1;
      const top = target[target.length - 1];
      return top.suit === bottomCard.suit && top.rank === bottomCard.rank - 1;
    }

    if (TABLEAU.includes(targetSlot)) {
      if (target.length === 0) return bottomCard.rank === 13;
      const top = target[target.length - 1];
      return isRed(top.suit) !== isRed(bottomCard.suit) && top.rank === bottomCard.rank + 1;
    }

    return false;
  }

  /**
   * Execute a move matching complete-transaction in klondike.scm:
   * move cards, adjust score, flip exposed tableau card.
   */
  #doMove(sourceSlot: number, sourceIndex: number, targetSlot: number) {
    const source = this.#slots[sourceSlot];
    const cards = source.splice(sourceIndex);
    this.#slots[targetSlot].push(...cards);

    if (FOUNDATIONS.includes(targetSlot)) this.#score += cards.length;
    if (FOUNDATIONS.includes(sourceSlot)) this.#score -= cards.length;

    // make-visible-top-card from klondike.scm
    if (TABLEAU.includes(sourceSlot) && source.length > 0) {
      source[source.length - 1].faceUp = true;
    }

    // game-won check: all 4 foundations have 13 cards
    if (FOUNDATIONS.every(f => this.#slots[f].length === 13)) {
      this.#gameState = 'won';
    }

    this.requestUpdate();
  }

  /**
   * Double-click auto-play matching button-double-clicked in
   * klondike.scm: move top card to foundation, then autoplay-foundations.
   */
  #doubleClick(slotIdx: number) {
    if (this.#gameState !== 'playing') return;
    const slot = this.#slots[slotIdx];
    if (slot.length === 0) return;
    const card = slot[slot.length - 1];
    if (!card.faceUp) return;

    for (const f of FOUNDATIONS) {
      if (this.#canDrop([card], f)) {
        this.#doMove(slotIdx, slot.length - 1, f);
        this.#autoPlay();
        return;
      }
    }
  }

  #autoPlay() {
    let moved = true;
    while (moved) {
      moved = false;
      for (const slotIdx of [WASTE, ...TABLEAU]) {
        const slot = this.#slots[slotIdx];
        if (slot.length === 0) continue;
        const card = slot[slot.length - 1];
        if (!card.faceUp) continue;
        if (!this.#isSafeAutoPlay(card)) continue;

        for (const f of FOUNDATIONS) {
          if (this.#canDrop([card], f)) {
            this.#doMove(slotIdx, slot.length - 1, f);
            moved = true;
            break;
          }
        }
      }
    }
  }

  #isSafeAutoPlay(card: Card): boolean {
    if (card.rank <= 2) return true;
    const oppositeColor = isRed(card.suit) ? [CLUBS, SPADES] : [DIAMONDS, HEARTS];
    return oppositeColor.every(suit => {
      const foundation = FOUNDATIONS.find(f => {
        const slot = this.#slots[f];
        return slot.length > 0 && slot[0].suit === suit;
      });
      if (foundation === undefined) return false;
      return this.#slots[foundation].length >= card.rank - 2;
    });
  }

  // --- Drag and Drop ---

  #onPointerDown(e: PointerEvent, slotIdx: number, cardIndex: number) {
    if (this.#gameState !== 'playing') return;
    if (e.button !== 0) return;

    const slot = this.#slots[slotIdx];
    const card = slot[cardIndex];
    if (!card.faceUp) return;

    if (slotIdx === WASTE && cardIndex !== slot.length - 1) return;
    if (FOUNDATIONS.includes(slotIdx) && cardIndex !== slot.length - 1) return;
    if (slotIdx === STOCK) return;

    const cards = slot.slice(cardIndex);
    const boardRect = this.shadowRoot!.getElementById('board')!.getBoundingClientRect();
    const cardEl = (e.target as HTMLElement).closest('.card') as HTMLElement;
    const cardRect = cardEl.getBoundingClientRect();

    this.#drag = {
      cards,
      sourceSlot: slotIdx,
      sourceIndex: cardIndex,
      offsetX: e.clientX - cardRect.left,
      offsetY: e.clientY - cardRect.top,
      currentX: cardRect.left - boardRect.left,
      currentY: cardRect.top - boardRect.top,
    };

    cardEl.setPointerCapture(e.pointerId);
    this.requestUpdate();
  }

  #onPointerMove(e: PointerEvent) {
    if (!this.#drag) return;
    const boardRect = this.shadowRoot!.getElementById('board')!.getBoundingClientRect();
    this.#drag = {
      ...this.#drag,
      currentX: e.clientX - boardRect.left - this.#drag.offsetX,
      currentY: e.clientY - boardRect.top - this.#drag.offsetY,
    };
    this.#dropTarget = this.#findDropTarget(e.clientX, e.clientY);
    this.requestUpdate();
  }

  #onPointerUp(_e: PointerEvent) {
    if (!this.#drag) return;
    const drag = this.#drag;

    if (this.#dropTarget !== null && this.#canDrop(drag.cards, this.#dropTarget)) {
      this.#doMove(drag.sourceSlot, drag.sourceIndex, this.#dropTarget);
    }

    this.#drag = null;
    this.#dropTarget = null;
    this.requestUpdate();
  }

  #findDropTarget(clientX: number, clientY: number): number | null {
    if (!this.#drag) return null;
    const boardRect = this.shadowRoot!.getElementById('board')!.getBoundingClientRect();
    const x = clientX - boardRect.left;
    const y = clientY - boardRect.top;

    const candidates = [...FOUNDATIONS, ...TABLEAU];
    let bestSlot: number | null = null;
    let bestDist = Infinity;

    for (const slotIdx of candidates) {
      if (slotIdx === this.#drag.sourceSlot) continue;
      const pos = this.#slotPosition(slotIdx);
      const slot = this.#slots[slotIdx];

      let targetY = pos.y;
      if (TABLEAU.includes(slotIdx) && slot.length > 0) {
        let offset = 0;
        for (let i = 0; i < slot.length; i++) {
          offset += slot[i].faceUp ? CASCADE_OFFSET : CASCADE_OFFSET_DOWN;
        }
        targetY = pos.y + offset - CASCADE_OFFSET;
      }

      const cx = pos.x + CARD_WIDTH / 2;
      const cy = targetY + CARD_HEIGHT / 2;
      const dist = Math.hypot(x - cx, y - cy);

      if (dist < bestDist && dist < CARD_WIDTH * 1.5) {
        if (this.#canDrop(this.#drag.cards, slotIdx)) {
          bestSlot = slotIdx;
          bestDist = dist;
        }
      }
    }

    return bestSlot;
  }

  // --- Layout ---

  /**
   * Slot positioning matching slot_update_geometry in board.c.
   * Uses xslotstep/yslotstep derived from the board grid size
   * (7 columns x 3.1 rows from klondike.scm new-game).
   */
  #slotPosition(slotIdx: number): { x: number; y: number } {
    if (slotIdx === STOCK) {
      return { x: CARD_OFFSET, y: CARD_OFFSET };
    }
    if (slotIdx === WASTE) {
      return { x: SLOT_STEP + CARD_OFFSET, y: CARD_OFFSET };
    }
    if (FOUNDATIONS.includes(slotIdx)) {
      const fi = slotIdx - 2;
      return { x: (3 + fi) * SLOT_STEP + CARD_OFFSET, y: CARD_OFFSET };
    }
    // Tableau: row 1 in the 3.1-row grid
    const ti = slotIdx - 6;
    return {
      x: ti * SLOT_STEP + CARD_OFFSET,
      y: CARD_HEIGHT + CARD_OFFSET * 2 + 6,
    };
  }

  #cardPosition(slotIdx: number, cardIndex: number): { x: number; y: number } {
    const slotPos = this.#slotPosition(slotIdx);
    if (!TABLEAU.includes(slotIdx)) {
      return slotPos;
    }
    let yOffset = 0;
    const slot = this.#slots[slotIdx];
    for (let i = 0; i < cardIndex; i++) {
      yOffset += slot[i].faceUp ? CASCADE_OFFSET : CASCADE_OFFSET_DOWN;
    }
    return { x: slotPos.x, y: slotPos.y + yOffset };
  }

  // --- Rendering ---

  #renderCard(card: Card, slotIdx: number, cardIndex: number) {
    const pos = this.#cardPosition(slotIdx, cardIndex);
    const isDragSource = this.#drag
      && this.#drag.sourceSlot === slotIdx
      && cardIndex >= this.#drag.sourceIndex;

    const posStyle = `left:${pos.x}px;top:${pos.y}px`;

    if (!card.faceUp) {
      return html`
        <div class="card" style=${posStyle}>
          <div class="card-back"></div>
        </div>
      `;
    }

    const slot = this.#slots[slotIdx];
    const isTop = cardIndex === slot.length - 1;
    const canDrag = card.faceUp && (
      (slotIdx === WASTE && isTop) ||
      TABLEAU.includes(slotIdx) ||
      (FOUNDATIONS.includes(slotIdx) && isTop)
    );

    const spritePos = cardSpritePosition(card);

    return html`
      <div class="card ${isDragSource ? 'drag-source' : ''}"
           style=${posStyle}
           @pointerdown=${canDrag ? (e: PointerEvent) => this.#onPointerDown(e, slotIdx, cardIndex) : nothing}
           @dblclick=${isTop ? () => this.#doubleClick(slotIdx) : nothing}>
        <div class="card-face" style="background-position:${spritePos}"></div>
      </div>
    `;
  }

  #renderDragCards() {
    if (!this.#drag) return nothing;
    const { cards, currentX, currentY } = this.#drag;
    return cards.map((card, i) => {
      const y = currentY + i * CASCADE_OFFSET;
      const spritePos = cardSpritePosition(card);

      return html`
        <div class="card dragging"
             style="left:${currentX}px;top:${y}px">
          <div class="card-face" style="background-position:${spritePos}"></div>
        </div>
      `;
    });
  }

  #renderSlot(slotIdx: number) {
    const pos = this.#slotPosition(slotIdx);
    const isTarget = this.#dropTarget === slotIdx;
    return html`
      <div class="slot ${isTarget ? 'drop-target' : ''}"
           style="left:${pos.x}px;top:${pos.y}px">
      </div>
    `;
  }

  render() {
    const stock = this.#slots[STOCK];
    const stockEmpty = stock?.length === 0;
    const canRecycle = stockEmpty
      && this.#redeals < MAX_REDEAL
      && (this.#slots[WASTE]?.length ?? 0) > 0;
    const stockPos = this.#slotPosition(STOCK);
    const redealsLeft = MAX_REDEAL - this.#redeals;

    return html`
      <div id="board"
           @pointermove=${(e: PointerEvent) => this.#onPointerMove(e)}
           @pointerup=${(e: PointerEvent) => this.#onPointerUp(e)}>

        ${Array.from({ length: 13 }, (_, i) => this.#renderSlot(i))}

        ${stock?.length ? html`
          <div class="card"
               style="left:${stockPos.x}px;top:${stockPos.y}px;cursor:pointer"
               @click=${() => this.#clickStock()}>
            <div class="card-back"></div>
          </div>
        ` : canRecycle ? html`
          <div class="stock-recycle"
               style="left:${stockPos.x}px;top:${stockPos.y}px"
               @click=${() => this.#clickStock()}>&#x21bb;</div>
        ` : nothing}

        ${this.#slots[WASTE]?.length ? this.#renderCard(
          this.#slots[WASTE][this.#slots[WASTE].length - 1],
          WASTE,
          this.#slots[WASTE].length - 1,
        ) : nothing}

        ${FOUNDATIONS.map(f =>
          this.#slots[f]?.length ? this.#renderCard(
            this.#slots[f][this.#slots[f].length - 1],
            f,
            this.#slots[f].length - 1,
          ) : nothing
        )}

        ${TABLEAU.map(t =>
          this.#slots[t]?.map((card, i) => this.#renderCard(card, t, i))
        )}

        ${this.#renderDragCards()}

        ${this.#gameState === 'won' ? html`
          <div class="game-won-overlay">
            <div class="game-won-dialog">
              <h3>Congratulations, you have won!</h3>
              <p>Score: ${this.#score}</p>
              <button @click=${() => this.#newGame()}>New Game</button>
            </div>
          </div>
        ` : nothing}
      </div>
      <div id="statusbar">
        <span>Stock left: ${stock?.length ?? 0}</span>
        <span>Redeals left: ${redealsLeft}</span>
        <span>Score: ${this.#score}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-sol': Gnome2Sol;
  }
}
