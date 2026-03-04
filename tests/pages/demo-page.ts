import type { Locator, Page } from '@playwright/test';
import { A11ySnapshot } from './a11y-snapshot.js';

export class DemoPage {
  readonly element: Locator;

  constructor(
    public readonly page: Page,
    public readonly tagName: string,
    public readonly demo?: string,
  ) {
    this.element = page.locator(this.tagName);
  }

  async goto() {
    await this.page.goto(`/elements/${this.tagName}/demo/${this.demo ? `${this.demo}/` : ''}`, {
      waitUntil: 'load',
      timeout: 30000,
    });
  }

  async captureEvent<TEvent = Event, TResult = TEvent>(
    eventName: string,
    options?: {
      locator?: Locator;
      extractor?: (event: TEvent) => TResult;
    }
  ): Promise<TResult> {
    const { locator, extractor } = options ?? {};
    if (extractor) {
      const extractorStr = extractor.toString();
      if (locator) {
        return locator.evaluate(
          (el, { name, extractorFn }) => {
            return new Promise(resolve => {
              el.addEventListener(name, ((e: Event) => {
                const fn = eval(`(${extractorFn})`);
                resolve(fn(e));
              }) as EventListener, { once: true });
            });
          },
          { name: eventName, extractorFn: extractorStr }
        ) as Promise<TResult>;
      }
      return this.page.evaluate(
        ({ name, extractorFn }) => {
          return new Promise(resolve => {
            document.addEventListener(name, ((e: Event) => {
              const fn = eval(`(${extractorFn})`);
              resolve(fn(e));
            }) as EventListener, { once: true });
          });
        },
        { name: eventName, extractorFn: extractorStr }
      ) as Promise<TResult>;
    }
    if (locator) {
      return locator
        .evaluateHandle((el, name) => {
          return new Promise(resolve => {
            el.addEventListener(name, ((e: Event) => resolve(e)) as EventListener, { once: true });
          });
        }, eventName)
        .then(handle => handle.jsonValue() as Promise<TResult>);
    }
    return this.page.evaluate(eventName => {
      return new Promise(resolve => {
        document.addEventListener(eventName, (e => resolve(e as unknown)), { once: true });
      });
    }, eventName) as Promise<TResult>;
  }

  async canCreateImperatively(): Promise<boolean> {
    return this.page.evaluate(tagName => {
      try {
        const element = document.createElement(tagName);
        return element.tagName.toLowerCase() === tagName.toLowerCase();
      } catch {
        return false;
      }
    }, this.tagName);
  }

  async a11ySnapshot(options?: { locator?: Locator; nth?: number }): Promise<A11ySnapshot> {
    let target: Locator;
    if (options?.locator) {
      target = options.locator;
    } else if (options?.nth !== undefined) {
      target = this.page.locator(this.tagName).nth(options.nth);
    } else {
      target = this.page.locator('cem-serve-demo');
    }
    const yamlSnapshot = await target.ariaSnapshot();
    return A11ySnapshot.fromYaml(yamlSnapshot);
  }
}
