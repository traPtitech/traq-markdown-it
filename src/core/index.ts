import type {
  Node,
  Document,
  Preset,
  Renderer,
  RenderContext
} from './types.js'
import { handlers as presetHandlers } from './preset.js'
import { escapeHtml } from './html.js'

export type {
  Node,
  Document,
  Preset,
  Renderer,
  RenderContext,
  Handler
} from './types.js'

export { Plugin } from './plugin.js'
export { PresetBuilder } from './preset.js'

export function renderer(preset: Preset): Renderer {
  const handlers = presetHandlers(preset)

  function render(document: Document, block: boolean) {
    let bytes: Uint8Array | undefined

    const fallback = (node: Node, block: boolean) => {
      bytes ??= new TextEncoder().encode(document.source)
      const text = escapeHtml(
        new TextDecoder().decode(bytes.subarray(node.span.start, node.span.end))
      )
      return block ? '<p>' + text + '</p>\n' : text
    }

    function nodes(
      values: Node[] = [],
      block = false,
      ancestors: readonly Node[] = []
    ): string {
      return values
        .map(node => {
          const handler = handlers.get(node.kind)

          if (!handler) return fallback(node, block)

          const parents = [...ancestors, node]
          const context: RenderContext = {
            source: document.source,
            ancestors,
            escape: escapeHtml,
            inline: values => nodes(values, false, parents),
            blocks: values => nodes(values, true, parents),
            fallback: node => fallback(node, block)
          }

          const output = handler(node, context)
          if (typeof output !== 'string')
            throw new TypeError('Render handlers must return HTML strings')
          return output
        })
        .join('')
    }

    return nodes(document.children, block)
  }
  return Object.freeze({
    render: (document: Document) => render(document, true),
    renderInline: (document: Document) => render(document, false)
  })
}
