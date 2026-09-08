import type { Options as CommonOptions } from '../commonmark/index.js'
import type { Options as GenericOptions } from '../commonmark/extensions/index.js'
import type { Options as TrapOptions } from '../trap/index.js'
export type Options = CommonOptions & GenericOptions & TrapOptions
import { plugin as common } from '../commonmark/index.js'
import { plugin as generic } from '../commonmark/extensions/index.js'
import { plugin as trap } from '../trap/index.js'
import { PresetBuilder } from '../core/preset.js'
import { createHighlightFunc } from '../commonmark/highlight.js'
import type { Document } from '../core/types.js'
import { renderer } from '../core/index.js'
import { prepareMessage } from './embeddings.js'
import { configurePreview } from './preview.js'
import { math } from '../commonmark/extensions/math.js'
export { embeddingFromUrl } from './embeddings.js'
export type { Embedding } from './embeddings.js'
import imageDomains from './image-domains.js'

const highlight = createHighlightFunc('traq-code traq-lang')
const validateImage = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && imageDomains.includes(url.hostname)
  } catch {
    return false
  }
}

function build(options: Options = {}, preview = false) {
  const commonPlugin = common({
    breaks: true,
    highlight,
    validateImage,
    linkAttributes: { target: '_blank', rel: 'nofollow noopener noreferrer' },
    ...options
  })
  const genericPlugin = generic(
    preview
      ? {
          ...options,
          math: (tex: string) =>
            options.math
              ? options.math(tex, false)
              : math(tex, false, {
                  maxSize: 1,
                  macros: {
                    '\\Huge': '',
                    '\\huge': '',
                    '\\LARGE': '',
                    '\\Large': '',
                    '\\large': ''
                  }
                })
        }
      : options
  )
  const trapPlugin = trap(options)
  if (preview)
    configurePreview(commonPlugin, genericPlugin, trapPlugin, options)
  return new PresetBuilder()
    .add(commonPlugin)
    .add(genericPlugin)
    .add(trapPlugin)
    .build()
}
export function html(options?: Options) {
  return build(options)
}

/** Render a full Rust-parsed document as message content or a one-line preview. */
export function messageRenderer({
  origin,
  ...options
}: Options & { origin: string }) {
  const embeddingOrigin = new URL(origin).origin
  const full = renderer(build(options)),
    preview = renderer(build(options, true))
  function render(document: Document, inline: boolean) {
    const prepared = prepareMessage(document, embeddingOrigin, inline)
    const renderedText = inline
      ? prepared.document.children
          .map(node =>
            preview.renderInline({ ...prepared.document, children: [node] })
          )
          .join(' ')
      : full.render(prepared.document)
    return {
      rawText: document.source,
      renderedText,
      embeddings: prepared.embeddings
    }
  }
  return Object.freeze({
    render: (document: Document) => render(document, false),
    renderInline: (document: Document) => render(document, true)
  })
}
