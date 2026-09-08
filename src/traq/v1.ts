import type { Options as CommonOptions } from '../commonmark/index.js'
import type { Options as GenericOptions } from '../commonmark/extensions/index.js'
import type { Options as TrapOptions } from '../trap/index.js'
export type Options = CommonOptions & GenericOptions & TrapOptions
import { plugin as common } from '../commonmark/index.js'
import { plugin as generic } from '../commonmark/extensions/index.js'
import { plugin as trap } from '../trap/index.js'
import { PresetBuilder } from '../core/preset.js'
import { createHighlightFunc } from '../commonmark/highlight.js'
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

export function html(options?: Options) {
  return new PresetBuilder()
    .add(
      common({
        breaks: true,
        highlight,
        validateImage,
        linkAttributes: {
          target: '_blank',
          rel: 'nofollow noopener noreferrer'
        },
        ...options
      })
    )
    .add(generic(options))
    .add(trap(options))
    .build()
}
