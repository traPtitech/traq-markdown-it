import type { Node } from './types.js'

const escapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}

export const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, c => escapes[c])

export function attributes(values: Iterable<readonly [string, string]>) {
  return Array.from(values, ([name, value]) => {
    if (!/^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(name))
      throw new TypeError('Invalid HTML attribute name: ' + name)

    return ' ' + name + '="' + escapeHtml(value) + '"'
  }).join('')
}

export function checked<
  NK extends { kind: string; data: unknown },
  K extends NK['kind'],
  C,
  R
>(
  kind: K,
  isKnownNode: (node: Node) => node is Node & NK,
  handler: (node: Node & Extract<NK, { kind: K }>, context: C) => R
): (node: Node, context: C) => R {
  return (node, context) => {
    if (node.kind !== kind || !isKnownNode(node))
      throw new TypeError('Invalid render payload: ' + node.kind)

    return handler(node as Node & Extract<NK, { kind: K }>, context)
  }
}
