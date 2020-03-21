/// <reference types="../src/types/markdown-it-mark" />
/* eslint-disable @typescript-eslint/camelcase */
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
import StateBlock from 'markdown-it/lib/rules_block/state_block'
import defaultWhitelist from './default/domain_whitelist'

import { Store } from './Store'
export { Store } from './Store'

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/f460f9a287a015b6d156f511209da74245344639/types/markdown-it/lib/index.d.ts#L36
interface MarkdownItE extends MarkdownIt {
  use<T extends Array<unknown> = unknown[]>(
    plugin: (md: MarkdownIt, ...params: T) => void,
    ...params: T
  ): MarkdownItE
}

export default class {
  readonly md = new MarkdownIt({
    breaks: true,
    linkify: true,
    highlight: createHighlightFunc('traq-code traq-lang')
  }) as MarkdownItE

  constructor(store: Store, whitelist: string[] = defaultWhitelist) {
    this.setRendererRule()
    this.setPlugin(store, whitelist)
  }

  setPlugin(store: Store, whitelist: string[]): void {
    this.md
      .use(MarkdownItMark)
      .use(spoiler, true)
      .use(json, store)
      .use(stamp, store)
      .use(katex, {
        katex: katexE,
        output: 'html',
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
    this.md.renderer.rules.table_open = (): string =>
      '<table class="is-scroll">'
    this.md.renderer.rules.blockquote_open = (): string =>
      '<blockquote class="is-scroll">'
    this.md.renderer.rules.bullet_list_open = (): string =>
      '<ul class="is-scroll">'
    this.md.renderer.rules.ordered_list_open = (): string =>
      '<ol class="is-scroll">'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockState = (this.md.block as any).State as StateBlock
    blockState.prototype.skipEmptyLines = function skipEmptyLines(
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

  render(text: string): string {
    return this.md.render(text, {})
  }

  renderInline(text: string): string {
    const parsed = this.md.parseInline(text, {})
    const tokens = parsed[0].children
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
    return rendered.join('')
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
