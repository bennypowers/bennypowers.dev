import '../ssr-shim.js';
import { ContextRoot, createContext, type Context } from '@lit/context';
import { isServer } from 'lit';

let root: ContextRoot;

function makeContextRoot() {
  const root = new ContextRoot();
  if (!isServer) {
    root.attach(document.body);
  }
  return root;
}

function createContextWithRoot<T>(
  ...args: Parameters<typeof createContext>
): Context<unknown, T> {
  root ??= makeContextRoot();
  return createContext<T>(...args);
}

export interface WindowEntry {
  id: string;
  url?: string;
  title: string;
  icon?: string;
  minimized: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  maximized?: boolean;
  workspace: number;
  closeHref?: string;
  appId?: string;
}

export interface TaskbarEntry {
  id: string;
  url: string;
  title: string;
  icon?: string;
  focused: boolean;
  minimized: boolean;
}

/** Lit context providing the wmId of the currently focused window. Use for tracking which window has focus. */
export const activeWindowContext =
  createContextWithRoot<string | undefined>('gnome2-active-window');

/** Lit context providing the list of taskbar entries for the active workspace. Use for rendering the window list in the panel. */
export const taskbarContext =
  createContextWithRoot<TaskbarEntry[]>('gnome2-taskbar');
