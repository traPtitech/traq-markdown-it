/// <reference types="../src/types/markdown-it-mark" />
import MarkdownIt from 'markdown-it'
import MarkdownItMark from 'markdown-it-mark'
import spoiler from '@traptitech/markdown-it-spoiler'
import stamp, { renderStamp } from './stamp'
import json from './json'
import katex from '@traptitech/markdown-it-katex'
import katexE from 'katex'
import mila from 'markdown-it-link-attributes'
import filter from 'markdown-it-image-filter'
import { createHighlightFunc } from './highlight'
import defaultWhitelist from './default/domain_whitelist'
import Token from 'markdown-it/lib/token'

import { Store } from './Store'
import EmbeddingExtractor, { EmbeddingOrUrl } from './embeddingExtractor'
export { Store } from './Store'
export {
  Embedding,
  EmbeddingOrUrl,
  ExternalUrl,
  EmbeddingFile,
  EmbeddingMessage
} from './embeddingExtractor'

export type MarkdownRenderResult = {
  embeddings: EmbeddingOrUrl[]
  rawText: string
  renderedText: string
}

export default class {
  readonly mdOptions = {
    breaks: true,
    linkify: true,
    highlight: createHighlightFunc('traq-code traq-lang')
  }
  readonly md = new MarkdownIt(this.mdOptions)
  readonly embeddingExtractor: EmbeddingExtractor

  constructor(
    store: Store,
    whitelist: readonly string[] = defaultWhitelist,
    embeddingOrigin: string
  ) {
    this.embeddingExtractor = new EmbeddingExtractor(embeddingOrigin)
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

  _render(tokens: Token[]): string {
    return this.md.renderer.render(tokens, this.mdOptions, {})
  }

  render(text: string): MarkdownRenderResult {
    const parsed = this.md.parse(text, {})
    const embeddings = this.embeddingExtractor.extract(parsed)
    this.embeddingExtractor.removeTailEmbeddings(parsed)

    return {
      embeddings,
      rawText: text,
      renderedText: this._render(parsed)
    }
  }

  renderInline(text: string): MarkdownRenderResult {
    const data = this.embeddingExtractor.replace(text)

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
      embeddings: [],
      rawText: text,
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
