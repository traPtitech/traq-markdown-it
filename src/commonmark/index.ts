export interface Options {
  validateLink?(destination: string): boolean
  validateImage?(destination: string): boolean
  breaks?: boolean
  /** Return highlighted HTML, or an empty string to use escaped code. */
  highlight?(code: string, language: string): string
  linkAttributes?: Readonly<Record<string, string>>
}
import { names, isKnownNode } from '@traq-markdown-parser/ts/commonmark/nodes'
import {
  token,
  pair,
  inlineToken,
  tokenHandler,
  renderTokens,
  checked
} from '../core/tokens.js'
import { Plugin as Declaration } from '@traq-markdown-parser/ts/definitions'
import { Plugin } from '../core/plugin.js'
import { PresetBuilder } from '../core/preset.js'
import { validateLink as defaultPolicy } from './policy.js'
import { listChildren } from './list.js'

const declaration = Declaration.group('commonmark').new('core')
export { names as nodes }
export function plugin({
  validateLink = defaultPolicy,
  validateImage = validateLink,
  breaks = false,
  highlight,
  linkAttributes = {}
}: Options = {}) {
  const attributes = Object.entries(linkAttributes)
  const result = new Plugin(declaration)
  result.on(
    names.Text,
    tokenHandler(
      checked(names.Text, isKnownNode, n => [
        token('text', '', 0, n.data.value)
      ])
    )
  )
  result.on(
    names.InlineCode,
    tokenHandler(
      checked(names.InlineCode, isKnownNode, n => [
        token('code_inline', 'code', 0, n.data.literal)
      ])
    )
  )
  result.on(
    names.Softbreak,
    tokenHandler(
      checked(names.Softbreak, isKnownNode, () => [
        token(breaks ? 'hardbreak' : 'softbreak', 'br')
      ])
    )
  )
  result.on(
    names.Hardbreak,
    tokenHandler(
      checked(names.Hardbreak, isKnownNode, () => [token('hardbreak', 'br')])
    )
  )
  result.on(
    names.Emphasis,
    tokenHandler(
      checked(names.Emphasis, isKnownNode, (n, ctx) =>
        pair('em', 'em', ctx.inline(n.children))
      )
    )
  )
  result.on(
    names.Strong,
    tokenHandler(
      checked(names.Strong, isKnownNode, (n, ctx) =>
        pair('strong', 'strong', ctx.inline(n.children))
      )
    )
  )
  result.on(
    names.Link,
    tokenHandler(
      checked(names.Link, isKnownNode, (n, ctx) => {
        if (!validateLink(n.data.destination)) return ctx.inline(n.children)
        const attrs: [string, string][] = [
          ['href', n.data.destination],
          ...attributes
        ]
        if (n.data.title !== null) attrs.push(['title', n.data.title])
        return pair('link', 'a', ctx.inline(n.children), {
          attrs,
          markup: n.data.form === 'explicit' ? '' : n.data.form
        })
      })
    )
  )
  result.on(
    names.Image,
    tokenHandler(
      checked(names.Image, isKnownNode, (n, ctx) => {
        if (!validateImage(n.data.destination)) return ctx.fallback(n)
        const t = token('image', 'img', 0, n.data.label_source)
        t.attrs = [
          ['src', n.data.destination],
          ['alt', '']
        ]
        if (n.data.title !== null) t.attrs.push(['title', n.data.title])
        t.children = ctx.inline(n.children)
        return [t]
      })
    )
  )
  result.on(
    names.Paragraph,
    tokenHandler(
      checked(names.Paragraph, isKnownNode, (n, ctx) =>
        pair('paragraph', 'p', [inlineToken(ctx.inline(n.children))], {
          block: true
        })
      )
    )
  )
  result.on(
    names.Heading,
    tokenHandler(
      checked(names.Heading, isKnownNode, (n, ctx) =>
        pair(
          'heading',
          `h${n.data.level}`,
          [inlineToken(ctx.inline(n.children))],
          {
            block: true
          }
        )
      )
    )
  )
  result.on(
    names.Blockquote,
    tokenHandler(
      checked(names.Blockquote, isKnownNode, (n, ctx) =>
        pair('blockquote', 'blockquote', ctx.blocks(n.children), {
          block: true,
          markup: '>'
        })
      )
    )
  )
  result.on(
    names.List,
    tokenHandler(
      checked(names.List, isKnownNode, (n, ctx) =>
        pair(
          n.data.ordered ? 'ordered_list' : 'bullet_list',
          n.data.ordered ? 'ol' : 'ul',
          listChildren(n, ctx),
          {
            block: true,
            attrs:
              n.data.ordered && n.data.start !== 1
                ? [['start', String(n.data.start)]]
                : null
          }
        )
      )
    )
  )
  result.on(
    names.ListItem,
    tokenHandler(
      checked(names.ListItem, isKnownNode, (n, ctx) =>
        pair('list_item', 'li', ctx.blocks(n.children), {
          block: true,
          markup: n.data.marker.slice(-1),
          info: n.data.marker.slice(0, -1)
        })
      )
    )
  )
  result.on(
    names.CodeBlock,
    tokenHandler(
      checked(names.CodeBlock, isKnownNode, n => {
        const t = token(
          n.data.fenced ? 'fence' : 'code_block',
          'code',
          0,
          n.data.literal
        )
        Object.assign(t, { info: n.data.info, block: true })
        if (highlight && n.data.fenced)
          return [token('html_block', '', 0, renderTokens([t], { highlight }))]
        return [t]
      })
    )
  )
  result.on(
    names.ThematicBreak,
    tokenHandler(
      checked(names.ThematicBreak, isKnownNode, n => {
        const t = token('hr', 'hr')
        Object.assign(t, { block: true, markup: n.data.marker })
        return [t]
      })
    )
  )
  result.on(
    names.HtmlInline,
    tokenHandler(
      checked(names.HtmlInline, isKnownNode, n => [
        token('text', '', 0, n.data.literal)
      ])
    )
  )
  result.on(
    names.HtmlBlock,
    tokenHandler(
      checked(names.HtmlBlock, isKnownNode, n =>
        pair(
          'escaped_html',
          'p',
          [inlineToken([token('text', '', 0, n.data.literal)])],
          {
            block: true
          }
        )
      )
    )
  )
  return result
}
export const html = Object.freeze({ plugin })
export function preset(options?: Options) {
  return new PresetBuilder().add(plugin(options)).build()
}
