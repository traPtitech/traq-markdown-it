/* eslint-disable @typescript-eslint/camelcase */
import MarkdownIt from 'markdown-it'
import MarkdownItMark from 'markdown-it-mark'
import spoiler from 'markdown-it-spoiler'
import stamp, { renderStamp } from './stamp'
import json from './json'
import katex from '@traPtitech/markdown-it-katex'
import katexE from 'katex'
import mila from 'markdown-it-link-attributes'
import filter from 'markdown-it-image-filter'
import { highlight } from './highlight'
import StateBlock from 'markdown-it/lib/rules_block/state_block'
import defaultWhitelist from './default/domain_whitelist'

import { Store } from './Store'
export { Store } from './Store'

export default class {
  readonly md = new MarkdownIt({
    breaks: true,
    linkify: true,
    highlight
  })

  constructor(store: Store, whitelist: string[] = defaultWhitelist) {
    this.setRendererRule()
    this.setPlugin(store, whitelist)
  }

  setPlugin(store: Store, whitelist: string[]): void {
    this.md.use(MarkdownItMark)
    this.md.use(spoiler, true)
    this.md.use(json, store)
    this.md.use(stamp, store)
    this.md.use(katex, {
      katex: katexE,
      output: 'html',
      maxSize: 100,
      blockClass: 'is-scroll'
    })
    this.md.use(mila, {
      attrs: {
        target: '_blank',
        rel: 'nofollow noopener noreferrer'
      }
    })
    this.md.use(filter(whitelist, { httpsOnly: true }))
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
