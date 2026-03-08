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

/** Map of app id → tag name for lazy loading before module is imported */
const TAG_MAP: Record<string, string> = {
  calculator: 'gnome2-calculator',
  mines: 'gnome2-mines',
  sol: 'gnome2-sol',
  supertux: 'gnome2-supertux',
  about: 'gnome2-about',
  pidgin: 'pidgin-conversation',
  terminal: 'gnome2-terminal',
};

const registry = new Map<string, AppDef>();

function kebabCase(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function getTagName(klass: Function): string {
  if (typeof customElements !== 'undefined' && 'getName' in customElements) {
    const name = (customElements as { getName(c: Function): string | null }).getName(klass);
    if (name) return name;
  }
  return kebabCase(klass.name);
}

/** Static fields required on classes decorated with `@appElement` */
interface AppElementStatics {
  appId: string;
  appLabel: string;
  appIcon: string;
  appAttrs?: () => Record<string, string>;
}

/**
 * Class decorator that registers a Lit element as a launchable app.
 * MUST be stacked above `@customElement` so its initializer runs after
 * the element is defined in the custom elements registry.
 *
 * The class MUST have static `appId`, `appLabel`, and `appIcon` fields.
 * TypeScript will error at compile time if any are missing. MAY have a
 * static `appAttrs` field for dynamic attributes.
 *
 * The tag name is resolved via `customElements.getName()` when available
 * (Baseline 2024). Falls back to kebab-casing the class name, which
 * works for all elements in this project (e.g. `Gnome2Calculator` →
 * `gnome2-calculator`). If a class name doesn't follow PascalCase
 * matching its tag name, use `customElements.getName()` or rename.
 *
 * @example
 * ```ts
 * @appElement({ width: '260px', height: '320px' })
 * @customElement('gnome2-calculator')
 * class Gnome2Calculator extends LitElement {
 *   static appId = 'calculator';
 *   static appLabel = 'Calculator';
 *   static appIcon = 'apps/accessories-calculator';
 * }
 * ```
 */
export function appElement(opts: { width: string; height: string }) {
  return function<T extends (abstract new (...args: any[]) => any) & AppElementStatics>(
    target: T,
    context: ClassDecoratorContext,
  ) {
    context.addInitializer(function() {
      const { appId: id, appLabel: label, appIcon: icon, appAttrs: attrs } = target;
      const tag = getTagName(target);
      const module = `gnome2/${tag}/${tag}.js`;
      registry.set(id, { id, tag, module, label, icon, ...opts, ...(attrs && { attrs }) });
    });
  };
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
  const tag = TAG_MAP[id];
  if (!tag) return undefined;
  return `gnome2/${tag}/${tag}.js`;
}

/** Get all known app IDs (available before loading). */
export function getAllAppIds(): string[] {
  return Object.keys(TAG_MAP);
}

/** Load an app module and return its metadata. */
export async function loadApp(id: string): Promise<AppDef | null> {
  const module = getAppModule(id);
  if (!module) return null;
  await import(module);
  return registry.get(id) ?? null;
}
