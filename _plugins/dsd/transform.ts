import type { Node, Element, Template } from '@parse5/tools'

type Attribute = Element['attrs'][number];

import { parse, serialize } from 'parse5';
import { isElementNode, isTemplateNode, queryAll } from '@parse5/tools';

const isShadowRootMode = (attr: Attribute) =>
  attr.name === 'shadowrootmode';

const isWorkaround = (node: Node): node is Element =>
     isElementNode(node)
  && node.tagName === 'webc-dsd-slot-workaround';

const isDSDTemplate = (node: Node): node is Template =>
     isTemplateNode(node)
  && node.attrs?.some(isShadowRootMode);

export function transform(content: string) {
  const document = parse(content)
  for (const template of queryAll<Template>(document, isDSDTemplate)) {
    const { content } = template;
    for (const node of queryAll<Element>(content, isWorkaround)) {
      node.tagName = 'slot';
    }
  }
  return serialize(document);
}
