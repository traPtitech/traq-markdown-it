import type Token from 'markdown-it/lib/token.mjs'
import type { TokenContext } from './tokens.js'
import type {
  Node,
  Document,
  Preset,
  Renderer,
  RenderContext
} from './types.js'
export type {
  Node,
  Document,
  Preset,
  Renderer,
  RenderContext,
  Handler
} from './types.js'
import { handlers as presetHandlers } from './preset.js'
import {
  token,
  inlineToken,
  pair,
  getTokenHandler,
  renderTokens,
  escapeHtml
} from './tokens.js'
export { Plugin } from './plugin.js'
export { PresetBuilder } from './preset.js'

// Parsing and presentation are independent. Markdown-it stays behind this API.
export function renderer(preset: Preset): Renderer {
  const handlers = presetHandlers(preset)
  function render(document: Document, inline: boolean) {
    let bytes: Uint8Array | undefined
    const fallback = (node: Node, block: boolean) => {
      bytes ??= new TextEncoder().encode(document.source)
      const text = new TextDecoder().decode(
        bytes.subarray(node.span.start, node.span.end)
      )
      const tokens = [token('text', '', 0, text)]
      return block
        ? pair('paragraph', 'p', [inlineToken(tokens)], { block: true })
        : tokens
    }
    function nodes(values: Node[] = [], block = false): Token[] {
      const ctx: TokenContext = {
        source: document.source,
        inline: values => nodes(values),
        blocks: values => nodes(values, true),
        fallback: node => fallback(node, block)
      }
      const html: RenderContext = {
        source: document.source,
        escape: escapeHtml,
        inline: values => renderTokens(nodes(values)),
        blocks: values => renderTokens(nodes(values, true)),
        fallback: node => renderTokens(fallback(node, block))
      }
      return values.flatMap(node => {
        const handler = handlers.get(node.kind)
        if (!handler) return fallback(node, block)
        const builtin = getTokenHandler(handler)
        if (builtin) return builtin(node, ctx)
        const output = handler(node, html)
        if (typeof output !== 'string')
          throw new TypeError('Render handlers must return HTML strings')
        return [token(block ? 'html_block' : 'html_inline', '', 0, output)]
      })
    }
    return inline
      ? [inlineToken(nodes(document.children))]
      : nodes(document.children, true)
  }
  return Object.freeze({
    render: (document: Document) => renderTokens(render(document, false)),
    renderInline: (document: Document) => renderTokens(render(document, true))
  })
}
