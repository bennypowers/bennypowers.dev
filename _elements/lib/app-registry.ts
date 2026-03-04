export interface AppDef {
  id: string;
  module: string;
  tag: string;
  label: string;
  icon: string;
  width: string;
  height: string;
  attrs?: () => Record<string, string>;
}

/** Static map of app id → module specifier for lazy loading */
const MODULE_MAP: Record<string, string> = {
  calculator: 'gnome2/gnome2-calculator/gnome2-calculator.js',
  mines: 'gnome2/gnome2-mines/gnome2-mines.js',
  supertux: 'gnome2/gnome2-supertux/gnome2-supertux.js',
  about: 'gnome2/gnome2-about/gnome2-about.js',
  pidgin: 'gnome2/pidgin-conversation/pidgin-conversation.js',
};

const registry = new Map<string, AppDef>();

/** Register app metadata. Called at module scope by each app element. */
export function registerApp(def: Omit<AppDef, 'module'>) {
  const module = MODULE_MAP[def.id];
  if (module) {
    registry.set(def.id, { ...def, module });
  }
}

/** Get a registered app's metadata (available after its module is loaded). */
export function getApp(id: string): AppDef | undefined {
  return registry.get(id);
}

/** Get all registered apps. */
export function getAllApps(): AppDef[] {
  return [...registry.values()];
}

/** Get the module specifier for an app (available before loading). */
export function getAppModule(id: string): string | undefined {
  return MODULE_MAP[id];
}

/** Get all known app IDs (available before loading). */
export function getAllAppIds(): string[] {
  return Object.keys(MODULE_MAP);
}

/** Load an app module and return its metadata. */
export async function loadApp(id: string): Promise<AppDef | null> {
  const module = MODULE_MAP[id];
  if (!module) return null;
  await import(module);
  return registry.get(id) ?? null;
}
