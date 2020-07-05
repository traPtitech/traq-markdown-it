/// <reference types="../src/types/markdown-it-mark" />
import MarkdownIt from 'markdown-it'
import MarkdownItMark from 'markdown-it-mark'
import spoiler from '@traptitech/markdown-it-spoiler'
import LinkifyIt from 'linkify-it'
import stamp, { renderStamp } from './stamp'
import json from './json'
import katex from '@traptitech/markdown-it-katex'
import katexE from 'katex'
import mila from 'markdown-it-link-attributes'
import filter from 'markdown-it-image-filter'
import { createHighlightFunc } from './highlight'
import defaultWhitelist from './default/domain_whitelist'

import { Store } from './Store'
import {
  createTypeExtractor,
  createIdExtractor,
  embeddingExtractor,
  embeddingReplacer,
  EmbeddingsExtractedMessage,
  EmbeddingTypeExtractor,
  EmbeddingIdExtractor
} from './embeddingExtractor'
export { Store } from './Store'
export {
  Embedding,
  ExternalUrl,
  EmbeddingFile,
  EmbeddingMessage,
  EmbeddingsExtractedMessage
} from './embeddingExtractor'

export type MarkdownRenderResult = EmbeddingsExtractedMessage & {
  renderedText: string
}

export default class {
  readonly md = new MarkdownIt({
    breaks: true,
    linkify: true,
    highlight: createHighlightFunc('traq-code traq-lang')
  })
  readonly linkify = new LinkifyIt(
    {
      'mailto:': '',
      'ftp:': ''
    },
    {
      fuzzyEmail: false
    }
  )
  readonly typeExtractor: EmbeddingTypeExtractor
  readonly idExtractor: EmbeddingIdExtractor

  constructor(
    store: Store,
    whitelist: readonly string[] = defaultWhitelist,
    embeddingOrigin: string
  ) {
    this.typeExtractor = createTypeExtractor(embeddingOrigin)
    this.idExtractor = createIdExtractor(embeddingOrigin)
    this.setRendererRule()
    this.setPlugin(store, whitelist)
  }

  setPlugin(store: Store, whitelist: readonly string[]): void {
    this.md
      .use(MarkdownItMark)
      .use(spoiler, true)
      .use(json, store)
      .use(stamp, store)
      .use(katex, {
        katex: katexE,
        output: 'html',
        strict: (errCode: string) =>
          errCode === 'unicodeTextInMathMode' ? 'ignore' : 'warn',
        maxSize: 100,
        blockClass: 'is-scroll'
      })
      .use(mila, {
        attrs: {
          target: '_blank',
          rel: 'nofollow noopener noreferrer'
        }
      })
      .use(filter(whitelist, { httpsOnly: true }))
  }

  setRendererRule(): void {
    this.md.block.State.prototype.skipEmptyLines = function skipEmptyLines(
      from: number
    ): number {
      for (let max = this.lineMax; from < max; from++) {
        if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
          break
        }
        this.push('hardbreak', 'br', 0)
      }
      return from
    }
  }

  render(text: string): MarkdownRenderResult {
    const data = embeddingExtractor(
      text,
      this.linkify,
      this.typeExtractor,
      this.idExtractor
    )
    return {
      ...data,
      renderedText: this.md.render(data.text, {})
    }
  }

  renderInline(text: string): MarkdownRenderResult {
    const data = embeddingReplacer(
      text,
      this.linkify,
      this.typeExtractor,
      this.idExtractor
    )

    const parsed = this.md.parseInline(data.text, {})
    const tokens = parsed[0].children || []
    const rendered = []
    for (const token of tokens) {
      if (token.type === 'regexp-0') {
        // stamp
        rendered.push(renderStamp(token.meta.match))
      } else if (token.type === 'spoiler_open') {
        rendered.push('<span class="spoiler">')
      } else if (token.type === 'spoiler_close') {
        rendered.push('</span>')
      } else if (token.type === 'softbreak') {
        // newline
        rendered.push(' ')
      } else {
        rendered.push(this.md.utils.escapeHtml(token.content))
      }
    }

    return {
      ...data,
      renderedText: rendered.join('')
    }
  }
}

export { createHighlightFunc } from './highlight'
export const markPlugin = MarkdownItMark
export const spoilerPlugin = spoiler
export const stampPlugin = stamp
export const jsonPlugin = json
export const katexPlugin = katex
export { useContainer } from './container'
export { stampCssPlugin } from './stampCss'
