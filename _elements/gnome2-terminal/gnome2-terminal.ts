import { LitElement, html, isServer } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { appElement } from '../lib/app-registry.js';
import { WMEvent } from '../lib/wm-event.js';
import styles from './gnome2-terminal.css';

interface FSEntry {
  name: string;
  type: 'dir' | 'file';
  url?: string;
}

interface FSDir {
  entries: FSEntry[];
}

/** Post titles extracted from filenames */
function slugToTitle(slug: string): string {
  return slug
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Build the virtual filesystem from the Atom feed at /feed.xml.
 * Parses entry URLs to derive directory structure (posts/, decks/, etc).
 */
async function buildFSFromFeed(): Promise<Record<string, FSDir>> {
  const fs: Record<string, FSDir> = {
    '/': {
      entries: [
        { name: 'posts', type: 'dir' },
        { name: 'decks', type: 'dir' },
        { name: 'about', type: 'file', url: '/about/' },
        { name: 'README', type: 'file' },
      ],
    },
    '/posts': { entries: [] },
    '/decks': { entries: [] },
  };

  try {
    const response = await fetch('/feed.xml');
    if (!response.ok) return fs;
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const entries = doc.querySelectorAll('entry');

    // Track subdirectories we discover (e.g. /posts/lets-build-web-components/)
    const subdirs = new Map<string, FSEntry[]>();

    for (const entry of entries) {
      const link = entry.querySelector('link');
      const href = link?.getAttribute('href') ?? '';
      // Extract path from full URL
      let path: string;
      try {
        path = new URL(href).pathname;
      } catch {
        path = href;
      }
      // Normalize: ensure leading /, strip trailing /
      if (!path.startsWith('/')) path = '/' + path;
      const cleanPath = path.replace(/\/$/, '');
      const segments = cleanPath.split('/').filter(Boolean);

      if (segments.length < 2) continue;

      const topDir = '/' + segments[0];
      const slug = segments[segments.length - 1];

      if (segments.length === 2) {
        // Direct child: e.g. /posts/my-post
        const dir = fs[topDir];
        if (dir) {
          dir.entries.push({ name: slug, type: 'file', url: path });
        }
      } else {
        // Nested: e.g. /posts/lets-build-web-components/part-1
        const parentDir = '/' + segments.slice(0, -1).join('/');
        const subDirName = segments[segments.length - 2];

        // Ensure the subdirectory entry exists in its parent
        const parentEntries = fs[topDir]?.entries;
        if (parentEntries && !parentEntries.some(e => e.name === subDirName)) {
          parentEntries.push({ name: subDirName, type: 'dir' });
        }

        // Add file to subdirectory
        if (!subdirs.has(parentDir)) subdirs.set(parentDir, []);
        subdirs.get(parentDir)!.push({ name: slug, type: 'file', url: path });
      }
    }

    // Ensure root-level dirs that have no entries still show up
    for (const topDir of ['/posts', '/decks']) {
      if (!fs[topDir]) fs[topDir] = { entries: [] };
      // Also ensure it's in root
      if (!fs['/'].entries.some(e => e.name === topDir.slice(1))) {
        fs['/'].entries.push({ name: topDir.slice(1), type: 'dir' });
      }
    }

    // Merge subdirectories
    for (const [dirPath, entries] of subdirs) {
      fs[dirPath] = { entries };
    }
  } catch {
    // Feed unavailable; keep empty filesystem
  }

  return fs;
}

const WRITE_COMMANDS = ['mkdir', 'touch', 'rm', 'mv', 'cp', 'chmod', 'chown', 'dd', 'mkfs'];

const MOTD = [
  '',
  '  Welcome to bennypowers.dev',
  '  GNOME Terminal 2.20.3',
  '',
  '  Type "help" for available commands.',
  '',
];

interface OutputLine {
  text: string;
  cls: string;
}

/**
 * A terminal emulator modeled after GNOME Terminal 2.20. Presents
 * the site content as a read-only filesystem with posts, decks,
 * and other pages. Supports ls, cd, cat, pwd, whoami, uname, help,
 * clear, and command history navigation.
 * SHOULD be launched from the Applications > Accessories menu.
 *
 * @summary GNOME Terminal emulator for browsing site content
 *
 * @fires command-executed - When a terminal command is executed
 */
@appElement({ width: '640px', height: '440px' })
@customElement('gnome2-terminal')
export class Gnome2Terminal extends LitElement {
  static appId = 'terminal';
  static appLabel = 'Terminal';
  static appIcon = 'apps/utilities-terminal';
  static styles = styles;

  @state() accessor #output: OutputLine[] = [];
  @state() accessor #cwd = '/';
  @state() accessor #inputValue = '';
  @state() accessor #historyIndex = -1;

  #history: string[] = [];
  #menubar: HTMLElement | null = null;
  #fs: Record<string, FSDir> = {};

  connectedCallback() {
    super.connectedCallback();
    if (isServer) return;
    this.#output = MOTD.map(text => ({ text, cls: 'info' }));
    this.#attachMenubar();
    buildFSFromFeed().then(fs => { this.#fs = fs; });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#menubar?.remove();
    this.#menubar = null;
  }

  /**
   * Attach the Terminal menubar to the parent gtk2-window.
   * Matches GNOME Terminal 2.20 menu layout: File, Edit, Help.
   */
  #attachMenubar() {
    const win = this.closest('gtk2-window');
    if (!win) return;
    const bar = document.createElement('gtk2-menu-bar');
    bar.slot = 'menubar';
    bar.innerHTML = /* html */`
      <gtk2-menu-button label="File">
        <gtk2-menu-item label="New Terminal" icon="apps/utilities-terminal"></gtk2-menu-item>
        <gtk2-menu-item separator></gtk2-menu-item>
        <gtk2-menu-item label="Close Terminal" icon="actions/window-close"></gtk2-menu-item>
      </gtk2-menu-button>
      <gtk2-menu-button label="Edit">
        <gtk2-menu-item label="Copy" icon="actions/edit-copy"></gtk2-menu-item>
        <gtk2-menu-item label="Paste" icon="actions/edit-paste"></gtk2-menu-item>
      </gtk2-menu-button>
      <gtk2-menu-button label="Help">
        <gtk2-menu-item label="About" icon="apps/help-browser"></gtk2-menu-item>
      </gtk2-menu-button>
    `;
    const items = bar.querySelectorAll<HTMLElement>('gtk2-menu-item:not([separator])');
    // New Terminal - stub
    items[0].addEventListener('click', () => { /* stub */ });
    // Close Terminal
    items[1].addEventListener('click', () => {
      const wmId = win.getAttribute('window-url') ?? '';
      win.dispatchEvent(new WMEvent('close', wmId));
    });
    // Copy
    items[2].addEventListener('click', () => {
      const selection = (this.shadowRoot as ShadowRoot & { getSelection?(): Selection | null })?.getSelection?.() ?? window.getSelection();
      if (selection?.toString()) {
        navigator.clipboard.writeText(selection.toString());
      }
    });
    // Paste
    items[3].addEventListener('click', async () => {
      const text = await navigator.clipboard.readText();
      this.#inputValue += text;
    });
    // About - stub
    items[4].addEventListener('click', () => {
      this.#appendOutput([
        { text: 'GNOME Terminal 2.20.3', cls: 'bold' },
        { text: 'A terminal emulator for the GNOME desktop.', cls: '' },
      ]);
    });
    win.appendChild(bar);
    this.#menubar = bar;
  }

  #resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return this.#normalizePath(path);
    }
    if (this.#cwd === '/') {
      return this.#normalizePath('/' + path);
    }
    return this.#normalizePath(this.#cwd + '/' + path);
  }

  #normalizePath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return '/' + resolved.join('/');
  }

  #getPromptPath(): string {
    if (this.#cwd === '/') return '~';
    return '~' + this.#cwd;
  }

  #appendOutput(lines: OutputLine[]) {
    this.#output = [...this.#output, ...lines];
  }

  async #execute(command: string) {
    const trimmed = command.trim();
    if (!trimmed) return;

    this.#history.unshift(trimmed);
    this.#historyIndex = -1;

    // Echo the command with prompt
    this.#appendOutput([{
      text: `${this.#getPromptText()}${trimmed}`,
      cls: '',
    }]);

    const [cmd, ...args] = trimmed.split(/\s+/);
    const fullArgs = trimmed.slice(cmd.length).trim();

    switch (cmd) {
      case 'ls':
        this.#cmdLs(args);
        break;
      case 'cd':
        this.#cmdCd(args);
        break;
      case 'cat':
        await this.#cmdCat(args);
        break;
      case 'pwd':
        this.#appendOutput([{ text: this.#cwd, cls: '' }]);
        break;
      case 'whoami':
        this.#appendOutput([{ text: 'guest', cls: '' }]);
        break;
      case 'uname':
        this.#appendOutput([{
          text: 'GNOME 2.20.3 bennypowers.dev x86_64 GNU/Linux',
          cls: '',
        }]);
        break;
      case 'help':
        this.#cmdHelp();
        break;
      case 'clear':
        this.#output = [];
        break;
      case 'echo':
        this.#appendOutput([{ text: fullArgs, cls: '' }]);
        break;
      case 'date':
        this.#appendOutput([{ text: new Date().toString(), cls: '' }]);
        break;
      case 'hostname':
        this.#appendOutput([{ text: 'bennypowers.dev', cls: '' }]);
        break;
      case 'rm':
        if (fullArgs.includes('-rf /') || fullArgs.includes('-rf /*')) {
          this.#appendOutput([{
            text: 'Nice try! Permission denied: This is a read-only filesystem, buddy.',
            cls: 'error',
          }]);
        } else {
          this.#appendOutput([{
            text: `rm: cannot remove '${args[args.length - 1] ?? ''}': Read-only file system`,
            cls: 'error',
          }]);
        }
        break;
      default:
        if (WRITE_COMMANDS.includes(cmd)) {
          this.#appendOutput([{
            text: `${cmd}: Permission denied: Read-only file system`,
            cls: 'error',
          }]);
        } else {
          this.#appendOutput([{
            text: `bash: ${cmd}: command not found`,
            cls: 'error',
          }]);
        }
    }
  }

  #cmdLs(args: string[]) {
    const target = args.filter(a => !a.startsWith('-'))[0];
    const path = target ? this.#resolvePath(target) : this.#cwd;
    const dir = this.#fs[path];

    if (!dir) {
      // Check if it's a file
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const fileName = path.substring(path.lastIndexOf('/') + 1);
      const parentDir = this.#fs[parentPath];
      if (parentDir?.entries.some(e => e.name === fileName && e.type === 'file')) {
        this.#appendOutput([{ text: fileName, cls: '' }]);
        return;
      }
      this.#appendOutput([{
        text: `ls: cannot access '${target ?? path}': No such file or directory`,
        cls: 'error',
      }]);
      return;
    }

    const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');

    if (showLong) {
      this.#appendOutput([{ text: `total ${dir.entries.length}`, cls: '' }]);
      for (const entry of dir.entries) {
        const perms = entry.type === 'dir' ? 'dr-xr-xr-x' : '-r--r--r--';
        const size = entry.type === 'dir' ? '4096' : ' 512';
        const date = 'Mar  8  2026';
        const name = entry.type === 'dir'
          ? entry.name
          : entry.name;
        this.#appendOutput([{
          text: `${perms}  1 guest guest ${size} ${date} ${name}`,
          cls: entry.type === 'dir' ? 'dir' : '',
        }]);
      }
    } else {
      const names = dir.entries.map(e =>
        e.type === 'dir' ? e.name + '/' : e.name
      );
      // Show in columns
      for (const name of names) {
        const entry = dir.entries.find(e =>
          (e.type === 'dir' ? e.name + '/' : e.name) === name
        );
        this.#appendOutput([{
          text: name,
          cls: entry?.type === 'dir' ? 'dir' : '',
        }]);
      }
    }
  }

  #cmdCd(args: string[]) {
    const target = args[0];
    if (!target || target === '~') {
      this.#cwd = '/';
      return;
    }
    const resolved = this.#resolvePath(target);
    if (this.#fs[resolved]) {
      this.#cwd = resolved;
    } else {
      // Check if target is a file
      const parentPath = resolved.substring(0, resolved.lastIndexOf('/')) || '/';
      const fileName = resolved.substring(resolved.lastIndexOf('/') + 1);
      const parentDir = this.#fs[parentPath];
      if (parentDir?.entries.some(e => e.name === fileName && e.type === 'file')) {
        this.#appendOutput([{
          text: `bash: cd: ${target}: Not a directory`,
          cls: 'error',
        }]);
      } else {
        this.#appendOutput([{
          text: `bash: cd: ${target}: No such file or directory`,
          cls: 'error',
        }]);
      }
    }
  }

  async #cmdCat(args: string[]) {
    if (args.length === 0) {
      this.#appendOutput([{
        text: 'cat: missing operand',
        cls: 'error',
      }]);
      return;
    }

    const target = args[0];
    const resolved = this.#resolvePath(target);

    // Check if it's a directory
    if (this.#fs[resolved]) {
      this.#appendOutput([{
        text: `cat: ${target}: Is a directory`,
        cls: 'error',
      }]);
      return;
    }

    // Find the file entry
    const parentPath = resolved.substring(0, resolved.lastIndexOf('/')) || '/';
    const fileName = resolved.substring(resolved.lastIndexOf('/') + 1);
    const parentDir = this.#fs[parentPath];
    const entry = parentDir?.entries.find(e => e.name === fileName && e.type === 'file');

    if (!entry) {
      this.#appendOutput([{
        text: `cat: ${target}: No such file or directory`,
        cls: 'error',
      }]);
      return;
    }

    if (entry.name === 'README') {
      this.#appendOutput([
        { text: 'bennypowers.dev', cls: 'bold' },
        { text: '', cls: '' },
        { text: 'Personal website and blog of Benny Powers.', cls: '' },
        { text: 'Web components, open source, and frontend development.', cls: '' },
        { text: '', cls: '' },
        { text: 'Built with Eleventy, Lit, and GNOME 2.20 nostalgia.', cls: '' },
      ]);
      return;
    }

    if (entry.url) {
      try {
        const response = await fetch(entry.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const htmlText = await response.text();
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');

        // Extract title
        const title = doc.querySelector('h1')?.textContent
          ?? doc.querySelector('title')?.textContent
          ?? slugToTitle(entry.name);

        // Extract description/summary
        const meta = doc.querySelector('meta[name="description"]');
        const description = meta?.getAttribute('content') ?? '';

        // Extract main text content
        const main = doc.querySelector('main, article, .content');
        const textContent = main?.textContent?.trim() ?? '';
        const lines = textContent
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .slice(0, 30);

        this.#appendOutput([
          { text: '', cls: '' },
          { text: `  ${title}`, cls: 'bold' },
          { text: `  ${entry.url}`, cls: 'info' },
          { text: '', cls: '' },
        ]);

        if (description) {
          this.#appendOutput([
            { text: `  ${description}`, cls: '' },
            { text: '', cls: '' },
          ]);
        }

        for (const line of lines) {
          this.#appendOutput([{ text: `  ${line}`, cls: '' }]);
        }

        if (textContent && lines.length >= 30) {
          this.#appendOutput([
            { text: '', cls: '' },
            { text: '  [... truncated. Visit the URL for full content.]', cls: 'info' },
          ]);
        }

        this.#appendOutput([{ text: '', cls: '' }]);
      } catch {
        this.#appendOutput([{
          text: `cat: error reading ${entry.url}: network error`,
          cls: 'error',
        }]);
      }
    } else {
      this.#appendOutput([{
        text: `(empty file)`,
        cls: 'info',
      }]);
    }
  }

  #cmdHelp() {
    this.#appendOutput([
      { text: 'Available commands:', cls: 'bold' },
      { text: '', cls: '' },
      { text: '  ls [path]       List directory contents', cls: '' },
      { text: '  ls -l [path]    Long listing format', cls: '' },
      { text: '  cd <path>       Change directory', cls: '' },
      { text: '  cat <file>      Print file contents (fetches page)', cls: '' },
      { text: '  pwd             Print working directory', cls: '' },
      { text: '  whoami          Print current user', cls: '' },
      { text: '  uname -a        Print system information', cls: '' },
      { text: '  echo <text>     Print text', cls: '' },
      { text: '  date            Print current date', cls: '' },
      { text: '  hostname        Print hostname', cls: '' },
      { text: '  clear           Clear the terminal', cls: '' },
      { text: '  help            Show this help message', cls: '' },
      { text: '', cls: '' },
      { text: 'Filesystem: /', cls: 'info' },
      { text: '  posts/          Blog posts', cls: '' },
      { text: '  decks/          Slide decks', cls: '' },
      { text: '  about           About page', cls: '' },
      { text: '  README          About this site', cls: '' },
    ]);
  }

  #tabComplete() {
    const input = this.#inputValue;
    const parts = input.split(/\s+/);
    const lastPart = parts[parts.length - 1] ?? '';

    // If only one word typed, complete commands
    if (parts.length <= 1 && !input.includes(' ')) {
      const commands = ['ls', 'cd', 'cat', 'pwd', 'whoami', 'uname', 'echo', 'date', 'hostname', 'clear', 'help'];
      const matches = commands.filter(c => c.startsWith(lastPart));
      if (matches.length === 1) {
        this.#inputValue = matches[0] + ' ';
      } else if (matches.length > 1) {
        this.#appendOutput([{
          text: `${this.#getPromptText()}${input}`,
          cls: '',
        }]);
        this.#appendOutput([{ text: matches.join('  '), cls: '' }]);
      }
      return;
    }

    // Complete paths
    let prefix: string;
    let dirPath: string;
    if (lastPart.includes('/')) {
      const lastSlash = lastPart.lastIndexOf('/');
      prefix = lastPart.substring(lastSlash + 1);
      const dirPart = lastPart.substring(0, lastSlash) || '/';
      dirPath = this.#resolvePath(dirPart);
    } else {
      prefix = lastPart;
      dirPath = this.#cwd;
    }

    const dir = this.#fs[dirPath];
    if (!dir) return;

    const matches = dir.entries.filter(e => e.name.startsWith(prefix));
    if (matches.length === 0) return;

    if (matches.length === 1) {
      const match = matches[0];
      const completed = match.name + (match.type === 'dir' ? '/' : ' ');
      if (lastPart.includes('/')) {
        const lastSlash = lastPart.lastIndexOf('/');
        parts[parts.length - 1] = lastPart.substring(0, lastSlash + 1) + completed;
      } else {
        parts[parts.length - 1] = completed;
      }
      this.#inputValue = parts.join(' ');
    } else {
      // Show all matches
      this.#appendOutput([{
        text: `${this.#getPromptText()}${input}`,
        cls: '',
      }]);
      this.#appendOutput([{
        text: matches.map(e => e.type === 'dir' ? e.name + '/' : e.name).join('  '),
        cls: '',
      }]);
      // Complete common prefix
      const names = matches.map(e => e.name);
      let common = names[0];
      for (const name of names.slice(1)) {
        while (common && !name.startsWith(common)) {
          common = common.slice(0, -1);
        }
      }
      if (common.length > prefix.length) {
        if (lastPart.includes('/')) {
          const lastSlash = lastPart.lastIndexOf('/');
          parts[parts.length - 1] = lastPart.substring(0, lastSlash + 1) + common;
        } else {
          parts[parts.length - 1] = common;
        }
        this.#inputValue = parts.join(' ');
      }
    }
  }

  #getPromptText(): string {
    return `guest@bennypowers.dev:${this.#getPromptPath()}$ `;
  }

  #onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      this.#tabComplete();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = this.#inputValue;
      this.#inputValue = '';
      this.#execute(command);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.#history.length > 0) {
        const nextIndex = Math.min(this.#historyIndex + 1, this.#history.length - 1);
        this.#historyIndex = nextIndex;
        this.#inputValue = this.#history[nextIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.#historyIndex > 0) {
        this.#historyIndex--;
        this.#inputValue = this.#history[this.#historyIndex];
      } else {
        this.#historyIndex = -1;
        this.#inputValue = '';
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.#output = [];
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      this.#appendOutput([{
        text: `${this.#getPromptText()}${this.#inputValue}^C`,
        cls: '',
      }]);
      this.#inputValue = '';
    }
  }

  #onInput(e: InputEvent) {
    this.#inputValue = (e.target as HTMLInputElement).value;
  }

  #focusInput() {
    const input = this.shadowRoot?.getElementById('input') as HTMLInputElement | null;
    input?.focus();
  }

  updated() {
    // Scroll to bottom
    const terminal = this.shadowRoot?.getElementById('terminal');
    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight;
    }
    // Keep focus on input
    this.#focusInput();
  }

  render() {
    return html`
      <div id="terminal" @click=${() => this.#focusInput()}>
        ${this.#output.map(line => html`
          <div class="output-line ${line.cls}">${line.text}</div>
        `)}
        <div id="input-line">
          <span id="prompt"><span class="user">guest@bennypowers.dev</span><span class="separator">:</span><span class="path">${this.#getPromptPath()}</span><span class="dollar">$ </span></span>
          <input id="input"
                 type="text"
                 .value=${this.#inputValue}
                 @keydown=${this.#onKeyDown}
                 @input=${this.#onInput}
                 spellcheck="false"
                 autocomplete="off"
                 autocapitalize="off"
                 aria-label="Terminal input">
        </div>
      </div>
      <div id="statusbar">
        <span>${this.#cwd}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gnome2-terminal': Gnome2Terminal;
  }
}
