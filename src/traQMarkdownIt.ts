import MarkdownIt from 'markdown-it'
import MarkdownItMark from 'markdown-it-mark'
import spoiler from '@traptitech/markdown-it-spoiler'
import stamp from './stamp'
import json from './json'
import katex from '@traptitech/markdown-it-katex'
import katexE from 'katex'
import mila from 'markdown-it-link-attributes'
import filter from 'markdown-it-image-filter'
import { createHighlightFunc } from './highlight'
import defaultWhitelist from './default/domain_whitelist'
import type Token from 'markdown-it/lib/token'
import type { Store } from './Store'
import EmbeddingExtractor, { EmbeddingOrUrl } from './embeddingExtractor'
import { InlineRenderer } from './InlineRenderer'

export type MarkdownRenderResult = {
  embeddings: EmbeddingOrUrl[]
  rawText: string
  renderedText: string
}

export class traQMarkdownIt {
  readonly mdOptions = {
    breaks: true,
    linkify: true,
    highlight: createHighlightFunc('traq-code traq-lang')
  } as const
  readonly katexOptions = {
    katex: katexE,
    output: 'html',
    strict: (errCode: string): string =>
      errCode === 'unicodeTextInMathMode' ? 'ignore' : 'warn',
    maxSize: 100,
    blockClass: 'is-scroll'
  } as const
  readonly md = new MarkdownIt(this.mdOptions)
  readonly embeddingExtractor: EmbeddingExtractor
  readonly inlineRenderer = new InlineRenderer()

  constructor(
    store: Readonly<Store>,
    whitelist: readonly string[] = defaultWhitelist,
    embeddingOrigin: string
  ) {
    this.embeddingExtractor = new EmbeddingExtractor(embeddingOrigin)
    this.setRendererRule()
    this.setPlugin(store, whitelist)
  }

  private setPlugin(
    store: Readonly<Store>,
    whitelist: readonly string[]
  ): void {
    this.md
      .use(MarkdownItMark)
      .use(spoiler, true)
      .use(json, store)
      .use(stamp, store)
      .use(katex, this.katexOptions)
      .use(mila, {
        attrs: {
          target: '_blank',
          rel: 'nofollow noopener noreferrer'
        }
      })
      .use(filter(whitelist, { httpsOnly: true }))

    const dummyMd = new MarkdownIt(this.mdOptions)
    dummyMd.use(katex, {
      ...this.katexOptions,
      maxSize: 1,
      macros: {
        // 文字サイズを変更する関数を無効化する
        '\\Huge': () => '',
        '\\huge': () => '',
        '\\LARGE': () => '',
        '\\Large': () => '',
        '\\large': () => ''
      }
    })

    this.inlineRenderer.setRules(this.md.renderer.rules, {
      math_inline: dummyMd.renderer.rules.math_inline,
      math_block: dummyMd.renderer.rules.math_inline
    })
  }

  private setRendererRule(): void {
    this.md.linkify.tlds(['app', 'dev', 'games', 'tech', 'show'], true)
    this.md.block.State.prototype.skipEmptyLines = function skipEmptyLines(
      from: number
    ): number {
      for (let max = this.lineMax; from < max; from++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (this.bMarks[from]! + this.tShift[from]! < this.eMarks[from]!) {
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

  _renderInline(tokens: Token[]): string {
    return this.inlineRenderer.render(tokens, this.mdOptions, {})
  }

  renderInline(text: string): MarkdownRenderResult {
    const parsed = this.md.parse(text, {})

    const embeddings = this.embeddingExtractor.extract(parsed)
    this.embeddingExtractor.removeTailEmbeddings(parsed)
    this.embeddingExtractor.replace(parsed)

    return {
      embeddings,
      rawText: text,
      renderedText: this._renderInline(parsed)
    }
  }
}
