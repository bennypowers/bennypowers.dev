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
}

export const activeWindowContext =
  createContextWithRoot<string | undefined>('gnome2-active-window');
