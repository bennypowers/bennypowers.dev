import { parse } from 'yaml';

export interface A11yTreeSnapshot {
  role: string;
  name?: string;
  children?: A11yTreeSnapshot[];
  checked?: boolean | 'mixed';
  disabled?: boolean;
  expanded?: boolean;
  level?: number;
  pressed?: boolean | 'mixed';
  selected?: boolean;
}

type SnapshotQuery = Partial<Record<keyof A11yTreeSnapshot, string | boolean | number | RegExp>>;

export class A11ySnapshot {
  #tree: A11yTreeSnapshot;

  constructor(tree: A11yTreeSnapshot) {
    this.#tree = tree;
  }

  get data(): A11yTreeSnapshot {
    return this.#tree;
  }

  query(query: SnapshotQuery): A11yTreeSnapshot | null {
    return this.#doQuery(query, this.#tree);
  }

  queryAll(query: SnapshotQuery): A11yTreeSnapshot[] {
    const items = new Set<A11yTreeSnapshot>();
    this.#doQuery(query, this.#tree, items);
    return [...items];
  }

  #matches(query: SnapshotQuery, snapshot = this.#tree): boolean {
    return Object.entries(query).every(([key, value]) =>
      value instanceof RegExp
        ? value.test(String(snapshot[key as keyof A11yTreeSnapshot]))
        : JSON.stringify(snapshot[key as keyof A11yTreeSnapshot]) === JSON.stringify(value)
    );
  }

  #doQuery(
    query: SnapshotQuery,
    snapshot: A11yTreeSnapshot,
    items?: Set<A11yTreeSnapshot>
  ): A11yTreeSnapshot | null {
    if (this.#matches(query, snapshot)) {
      if (items) {
        items.add(snapshot);
        if (snapshot.children) {
          for (const kid of snapshot.children) {
            this.#doQuery(query, kid, items);
          }
        }
        return null;
      } else {
        return snapshot;
      }
    }
    if (snapshot.children) {
      for (const kid of snapshot.children) {
        const result = this.#doQuery(query, kid, items);
        if (result) return result;
      }
    }
    return null;
  }

  static fromYaml(yamlString: string): A11ySnapshot {
    const tree = this.#parseAriaSnapshot(yamlString);
    return new A11ySnapshot(tree);
  }

  static #parseAriaSnapshot(yamlString: string): A11yTreeSnapshot {
    const parsed = parse(yamlString);

    function parseNode(item: string | A11yTreeSnapshot): A11yTreeSnapshot {
      if (typeof item === 'string') {
        const match = item.match(/^(\w+)(?:\s+"([^"]*)")?(?:\s+(.+))?$/);
        if (!match) return { role: 'generic' };
        const [, role = 'generic', name, attributes] = match;
        const node: A11yTreeSnapshot = { role };
        if (name) node.name = name;
        if (attributes) {
          const attrMatches = attributes.matchAll(/\[(\w+)(?:=(\w+))?\]/g);
          for (const [, key, value] of attrMatches) {
            switch (key) {
              case 'disabled': node.disabled = true; break;
              case 'checked': node.checked = value === 'mixed' ? 'mixed' : value !== 'false'; break;
              case 'pressed': node.pressed = value === 'mixed' ? 'mixed' : value !== 'false'; break;
              case 'expanded': node.expanded = value !== 'false'; break;
              case 'selected': node.selected = value !== 'false'; break;
              case 'level': node.level = parseInt(value ?? '-1', 10); break;
            }
          }
        }
        return node;
      } else if (typeof item === 'object' && item !== null) {
        const keys = Object.keys(item) as (keyof A11yTreeSnapshot)[];
        if (keys.length === 0) return { role: 'generic' };
        const [key] = keys;
        if (key !== undefined) {
          const node = parseNode(key);
          const children = item[key!];
          if (Array.isArray(children)) {
            node.children = children.map(parseNode).filter(child =>
              child.role !== 'generic' || child.name);
          }
          return node;
        }
      }
      return { role: 'generic' };
    }

    if (Array.isArray(parsed)) {
      return { role: 'WebArea', children: parsed.map(parseNode) };
    }
    return parseNode(parsed);
  }
}
