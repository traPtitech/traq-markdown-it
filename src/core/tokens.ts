import type { Options } from 'markdown-it'
import type { Node, Handler } from './types.js'
export interface TokenContext {
  source: string
  inline(nodes?: Node[]): Token[]
  blocks(nodes?: Node[]): Token[]
  fallback(node: Node): Token[]
}
export type TokenHandler = (node: Node, context: TokenContext) => Token[]
import Token from 'markdown-it/lib/token.mjs'
import MarkdownRenderer from 'markdown-it/lib/renderer.mjs'
export { escapeHtml } from 'markdown-it/lib/common/utils.mjs'

// Only built-in adapters use tokens. Public handlers receive and return HTML.
const tokenHandlers = new WeakMap<Handler, TokenHandler>()
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
export function tokenHandler(handler: TokenHandler): Handler {
  const opaque = handler as unknown as Handler
  tokenHandlers.set(opaque, handler)
  return opaque
}
export const getTokenHandler = (handler: Handler) => tokenHandlers.get(handler)

const renderer = new MarkdownRenderer()
export function renderTokens(tokens: Token[], options: Options = {}) {
  return renderer.render(
    tokens,
    {
      breaks: false,
      xhtmlOut: false,
      langPrefix: 'language-',
      ...options
    },
    {}
  )
}

export function token(
  type: string,
  tag = '',
  nesting: -1 | 0 | 1 = 0,
  content = ''
) {
  const value = new Token(type, tag, nesting)
  value.content = content
  return value
}

export function pair(
  type: string,
  tag: string,
  children: Token[],
  {
    block = false,
    attrs = null,
    markup = '',
    hidden = false,
    info = ''
  }: Partial<Pick<Token, 'block' | 'attrs' | 'markup' | 'hidden' | 'info'>> = {}
) {
  const open = token(type + '_open', tag, 1),
    close = token(type + '_close', tag, -1)
  Object.assign(open, { block, attrs, markup, hidden, info })
  Object.assign(close, { block, markup, hidden })
  return [open, ...children, close]
}

export function inlineToken(children: Token[]) {
  const value = token('inline')
  value.children = children
  return value
}
