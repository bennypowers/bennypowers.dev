import { LitElement, html, nothing, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { appElement } from '../lib/app-registry.js';
import { WMEvent } from '../lib/wm-event.js';
import styles from './gnome2-gedit.css';

interface Tab {
  id: number;
  title: string;
  content: string;
  modified: boolean;
  fileHandle: FileSystemFileHandle | null;
  /** Undo stack: previous content states */
  undoStack: string[];
  /** Redo stack: content states undone */
  redoStack: string[];
  /** Cursor line (1-based) */
  cursorLine: number;
  /** Cursor column (1-based) */
  cursorCol: number;
}

let nextTabId = 1;

function createTab(title?: string, content = '', fileHandle: FileSystemFileHandle | null = null): Tab {
  return {
    id: nextTabId++,
    title: title ?? `Untitled Document ${nextTabId - 1}`,
    content,
    modified: false,
    fileHandle,
    undoStack: [],
    redoStack: [],
    cursorLine: 1,
    cursorCol: 1,
  };
}

/**
 * gedit text editor modeled after gedit 2.20 from GNOME 2.20. Provides
 * a tabbed document interface with line numbers, cursor position
 * tracking, and File System Access API integration for opening and
 * saving real files. Falls back to file input and download blobs when
 * the File System Access API is unavailable.
 * SHOULD be launched from the Applications > Accessories menu.
 *
 * @summary gedit GNOME text editor with tabbed editing and file access
 *
 * @fires tab-changed - When the active tab changes
 */
@appElement({ width: '640px', height: '480px' })
@customElement('gnome2-gedit')
export class Gnome2Gedit extends LitElement {
  static appId = 'gedit';
  static appLabel = 'Text Editor';
  static appIcon = 'apps/accessories-text-editor';
  static styles = styles;

  @state() accessor #tabs: Tab[] = [];
  @state() accessor #activeTabId = 0;
  @state() accessor #showLineNumbers = true;

  #menubar: HTMLElement | null = null;
  #fileInput: HTMLInputElement | null = null;

  get #activeTab(): Tab | undefined {
    return this.#tabs.find(t => t.id === this.#activeTabId);
  }

  get #hasFileSystemAccess(): boolean {
    return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
  }

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.#tabs = [createTab()];
    this.#activeTabId = this.#tabs[0].id;
    this.#attachMenubar();
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#menubar?.remove();
    this.#menubar = null;
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  /**
   * Attach the gedit menubar to the parent gtk2-window.
   * Matches the GtkUIManager menubar from gedit 2.20: File, Edit,
   * View, Search, Documents, Help.
   */
  #attachMenubar() {
    const win = this.closest('gtk2-window');
    if (!win) return;
    const bar = document.createElement('gtk2-menu-bar');
    bar.slot = 'menubar';
    bar.innerHTML = /* html */`
      <gtk2-menu-button label="File">
        <gtk2-menu-item label="New" icon="actions/document-new"></gtk2-menu-item>
        <gtk2-menu-item label="Open..." icon="actions/document-open"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Save" icon="actions/document-save"></gtk2-menu-item>
        <gtk2-menu-item label="Save As..." icon="actions/document-save-as"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Close" icon="actions/window-close"></gtk2-menu-item>
      </gtk2-menu-button>
      <gtk2-menu-button label="Edit">
        <gtk2-menu-item label="Undo" icon="actions/edit-undo"></gtk2-menu-item>
        <gtk2-menu-item label="Redo" icon="actions/edit-redo"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Cut" icon="actions/edit-cut"></gtk2-menu-item>
        <gtk2-menu-item label="Copy" icon="actions/edit-copy"></gtk2-menu-item>
        <gtk2-menu-item label="Paste" icon="actions/edit-paste"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Select All"></gtk2-menu-item>
      </gtk2-menu-button>
      <gtk2-menu-button label="View">
        <gtk2-menu-item label="Line Numbers" checked></gtk2-menu-item>
      </gtk2-menu-button>
      <gtk2-menu-button label="Help">
        <gtk2-menu-item label="About"></gtk2-menu-item>
      </gtk2-menu-button>
    `;

    const items = bar.querySelectorAll<HTMLElement>('gtk2-menu-item:not([separator])');
    // File menu
    items[0].addEventListener('click', () => this.#newTab());              // New
    items[1].addEventListener('click', () => this.#openFile());            // Open
    items[2].addEventListener('click', () => this.#saveFile());            // Save
    items[3].addEventListener('click', () => this.#saveFileAs());          // Save As
    items[4].addEventListener('click', () => {                             // Close
      if (this.#tabs.length > 1) {
        this.#closeTab(this.#activeTabId);
      } else {
        const wmId = win.getAttribute('window-url') ?? '';
        win.dispatchEvent(new WMEvent('close', wmId));
      }
    });
    // Edit menu
    items[5].addEventListener('click', () => this.#undo());                // Undo
    items[6].addEventListener('click', () => this.#redo());                // Redo
    items[7].addEventListener('click', () => this.#execCommand('cut'));     // Cut
    items[8].addEventListener('click', () => this.#execCommand('copy'));    // Copy
    items[9].addEventListener('click', () => this.#execCommand('paste'));   // Paste
    items[10].addEventListener('click', () => this.#selectAll());          // Select All
    // View menu
    items[11].addEventListener('click', () => {                            // Line Numbers
      this.#showLineNumbers = !this.#showLineNumbers;
      if (this.#showLineNumbers) {
        items[11].setAttribute('checked', '');
      } else {
        items[11].removeAttribute('checked');
      }
    });

    win.appendChild(bar);
    this.#menubar = bar;
  }

  #onKeyDown = (e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;

    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault();
        this.#newTab();
        break;
      case 'o':
        e.preventDefault();
        this.#openFile();
        break;
      case 's':
        e.preventDefault();
        if (e.shiftKey) {
          this.#saveFileAs();
        } else {
          this.#saveFile();
        }
        break;
      case 'w':
        e.preventDefault();
        if (this.#tabs.length > 1) {
          this.#closeTab(this.#activeTabId);
        }
        break;
      case 'z':
        e.preventDefault();
        if (e.shiftKey) {
          this.#redo();
        } else {
          this.#undo();
        }
        break;
      case 'y':
        e.preventDefault();
        this.#redo();
        break;
    }
  };

  // --- Tab Management ---

  #newTab() {
    const tab = createTab();
    this.#tabs = [...this.#tabs, tab];
    this.#activeTabId = tab.id;
  }

  #closeTab(tabId: number) {
    const idx = this.#tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;
    const newTabs = this.#tabs.filter(t => t.id !== tabId);
    if (newTabs.length === 0) {
      // Keep at least one tab
      const tab = createTab();
      this.#tabs = [tab];
      this.#activeTabId = tab.id;
      return;
    }
    if (this.#activeTabId === tabId) {
      // Switch to adjacent tab
      const newIdx = Math.min(idx, newTabs.length - 1);
      this.#activeTabId = newTabs[newIdx].id;
    }
    this.#tabs = newTabs;
  }

  #switchTab(tabId: number) {
    this.#activeTabId = tabId;
  }

  // --- File Operations ---

  async #openFile() {
    if (this.#hasFileSystemAccess) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          multiple: false,
        });
        const file: File = await handle.getFile();
        const content = await file.text();
        const tab = createTab(file.name, content, handle);
        this.#tabs = [...this.#tabs, tab];
        this.#activeTabId = tab.id;
      } catch {
        // User cancelled the picker
      }
    } else {
      // Fallback: use hidden file input
      if (!this.#fileInput) {
        this.#fileInput = document.createElement('input');
        this.#fileInput.type = 'file';
        this.#fileInput.style.display = 'none';
        this.#fileInput.addEventListener('change', async () => {
          const file = this.#fileInput?.files?.[0];
          if (!file) return;
          const content = await file.text();
          const tab = createTab(file.name, content);
          this.#tabs = [...this.#tabs, tab];
          this.#activeTabId = tab.id;
          if (this.#fileInput) this.#fileInput.value = '';
        });
        this.shadowRoot!.appendChild(this.#fileInput);
      }
      this.#fileInput.click();
    }
  }

  async #saveFile() {
    const tab = this.#activeTab;
    if (!tab) return;

    if (tab.fileHandle && this.#hasFileSystemAccess) {
      try {
        const writable = await (tab.fileHandle as any).createWritable();
        await writable.write(tab.content);
        await writable.close();
        tab.modified = false;
        this.requestUpdate();
      } catch {
        // Save failed or permission denied
      }
    } else {
      await this.#saveFileAs();
    }
  }

  async #saveFileAs() {
    const tab = this.#activeTab;
    if (!tab) return;

    if (this.#hasFileSystemAccess) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: tab.title,
        });
        const writable = await handle.createWritable();
        await writable.write(tab.content);
        await writable.close();
        tab.fileHandle = handle;
        tab.title = (await handle.getFile()).name;
        tab.modified = false;
        this.requestUpdate();
      } catch {
        // User cancelled or save failed
      }
    } else {
      // Fallback: download as blob
      const blob = new Blob([tab.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tab.title;
      a.click();
      URL.revokeObjectURL(url);
      tab.modified = false;
      this.requestUpdate();
    }
  }

  // --- Edit Operations ---

  #execCommand(command: string) {
    const textarea = this.shadowRoot?.querySelector('textarea');
    if (!textarea) return;
    textarea.focus();
    if (command === 'cut') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      if (selected) {
        navigator.clipboard.writeText(selected);
        this.#pushUndo();
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        textarea.value = before + after;
        textarea.selectionStart = textarea.selectionEnd = start;
        this.#syncContent();
      }
    } else if (command === 'copy') {
      const selected = textarea.value.substring(
        textarea.selectionStart,
        textarea.selectionEnd,
      );
      if (selected) navigator.clipboard.writeText(selected);
    } else if (command === 'paste') {
      navigator.clipboard.readText().then(text => {
        if (!text) return;
        this.#pushUndo();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        textarea.value = before + text + after;
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        this.#syncContent();
      });
    }
  }

  #selectAll() {
    const textarea = this.shadowRoot?.querySelector('textarea');
    if (!textarea) return;
    textarea.focus();
    textarea.select();
  }

  #pushUndo() {
    const tab = this.#activeTab;
    if (!tab) return;
    tab.undoStack.push(tab.content);
    tab.redoStack = [];
    // Limit undo stack
    if (tab.undoStack.length > 200) tab.undoStack.shift();
  }

  #undo() {
    const tab = this.#activeTab;
    if (!tab || tab.undoStack.length === 0) return;
    tab.redoStack.push(tab.content);
    tab.content = tab.undoStack.pop()!;
    tab.modified = true;
    this.requestUpdate();
    // Restore textarea value
    requestAnimationFrame(() => {
      const textarea = this.shadowRoot?.querySelector('textarea');
      if (textarea) textarea.value = tab.content;
    });
  }

  #redo() {
    const tab = this.#activeTab;
    if (!tab || tab.redoStack.length === 0) return;
    tab.undoStack.push(tab.content);
    tab.content = tab.redoStack.pop()!;
    tab.modified = true;
    this.requestUpdate();
    requestAnimationFrame(() => {
      const textarea = this.shadowRoot?.querySelector('textarea');
      if (textarea) textarea.value = tab.content;
    });
  }

  // --- Content Sync ---

  #syncContent() {
    const tab = this.#activeTab;
    const textarea = this.shadowRoot?.querySelector('textarea');
    if (!tab || !textarea) return;
    tab.content = textarea.value;
    tab.modified = true;
    this.requestUpdate();
  }

  #onInput() {
    this.#pushUndo();
    this.#syncContent();
  }

  #onCursorMove() {
    const tab = this.#activeTab;
    const textarea = this.shadowRoot?.querySelector('textarea');
    if (!tab || !textarea) return;
    const pos = textarea.selectionStart;
    const text = textarea.value.substring(0, pos);
    const lines = text.split('\n');
    tab.cursorLine = lines.length;
    tab.cursorCol = lines[lines.length - 1].length + 1;
    this.requestUpdate();
  }

  // --- Line Numbers ---

  get #lineCount(): number {
    const tab = this.#activeTab;
    if (!tab) return 1;
    return Math.max(1, tab.content.split('\n').length);
  }

  // --- Rendering ---

  #renderTabs() {
    return html`
      <div id="tabbar">
        ${this.#tabs.map(tab => html`
          <div class=${classMap({ tab: true, active: tab.id === this.#activeTabId })}
               @click=${() => this.#switchTab(tab.id)}>
            <span class="tab-label">${tab.modified ? '*' : ''}${tab.title}</span>
            <button class="tab-close"
                    @click=${(e: Event) => { e.stopPropagation(); this.#closeTab(tab.id); }}
                    aria-label="Close tab">x</button>
          </div>
        `)}
      </div>
    `;
  }

  #renderGutter() {
    if (!this.#showLineNumbers) return nothing;
    const lines = Array.from({ length: this.#lineCount }, (_, i) => i + 1);
    return html`
      <div id="gutter" aria-hidden="true">
        ${lines.map(n => html`<div class="line-number">${n}</div>`)}
      </div>
    `;
  }

  #renderStatusbar() {
    const tab = this.#activeTab;
    return html`
      <div id="statusbar">
        <span>Ln ${tab?.cursorLine ?? 1}, Col ${tab?.cursorCol ?? 1}</span>
        <span>Plain Text</span>
      </div>
    `;
  }

  render() {
    const tab = this.#activeTab;
    return html`
      ${this.#renderTabs()}
      <div id="editor-area">
        ${this.#renderGutter()}
        <textarea
          id="editor"
          .value=${tab?.content ?? ''}
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          wrap="off"
          @input=${() => this.#onInput()}
          @click=${() => this.#onCursorMove()}
          @keyup=${() => this.#onCursorMove()}
          @scroll=${this.#onEditorScroll}
        ></textarea>
      </div>
      ${this.#renderStatusbar()}
    `;
  }

  #onEditorScroll = () => {
    const textarea = this.shadowRoot?.querySelector('textarea');
    const gutter = this.shadowRoot?.getElementById('gutter');
    if (textarea && gutter) {
      gutter.scrollTop = textarea.scrollTop;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-gedit': Gnome2Gedit;
  }
}
