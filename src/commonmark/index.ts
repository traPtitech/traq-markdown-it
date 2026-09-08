export interface Options {
  validateLink?(destination: string): boolean
  validateImage?(destination: string): boolean
  breaks?: boolean
  /** Return highlighted HTML, or an empty string to use escaped code. */
  highlight?(code: string, language: string): string
  linkAttributes?: Readonly<Record<string, string>>
}
import { decodeHTMLStrict } from 'entities'
import type { Node } from '../core/types.js'
import { names, isKnownNode } from '@traq-markdown-parser/traq/commonmark/nodes'
import { attributes, escapeHtml, checked } from '../core/html.js'
import { Plugin as Declaration } from '../core/definitions.js'
import { Plugin } from '../core/plugin.js'
import { PresetBuilder } from '../core/preset.js'
import { validateLink as defaultPolicy } from './policy.js'

const declaration = Declaration.group('commonmark').new('core')
export { names as nodes }
function tightList(node?: Node) {
  return (
    !!node && isKnownNode(node) && node.kind === names.List && node.data.tight
  )
}
function imageText(nodes: Node[] = [], source: string): string {
  return nodes
    .map(node => {
      if (!isKnownNode(node))
        return new TextDecoder().decode(
          new TextEncoder()
            .encode(source)
            .subarray(node.span.start, node.span.end)
        )
      switch (node.kind) {
        case names.Text:
          return node.data.value
        case names.HtmlInline:
          return node.data.literal
        case names.Softbreak:
        case names.Hardbreak:
          return '\n'
        case names.InlineCode:
          return node.data.literal
        default:
          return imageText(node.children, source)
      }
    })
    .join('')
}
export function plugin({
  validateLink = defaultPolicy,
  validateImage = validateLink,
  breaks = false,
  highlight,
  linkAttributes = {}
}: Options = {}) {
  const linkAttrs = attributes(Object.entries(linkAttributes))
  const result = new Plugin(declaration)
  result.on(
    names.Text,
    checked(names.Text, isKnownNode, n => escapeHtml(n.data.value))
  )
  result.on(
    names.InlineCode,
    checked(
      names.InlineCode,
      isKnownNode,
      n => '<code>' + escapeHtml(n.data.literal) + '</code>'
    )
  )
  result.on(
    names.Softbreak,
    checked(names.Softbreak, isKnownNode, () => (breaks ? '<br>\n' : '\n'))
  )
  result.on(
    names.Hardbreak,
    checked(names.Hardbreak, isKnownNode, () => '<br>\n')
  )
  result.on(
    names.Emphasis,
    checked(
      names.Emphasis,
      isKnownNode,
      (n, ctx) => '<em>' + ctx.inline(n.children) + '</em>'
    )
  )
  result.on(
    names.Strong,
    checked(
      names.Strong,
      isKnownNode,
      (n, ctx) => '<strong>' + ctx.inline(n.children) + '</strong>'
    )
  )
  result.on(
    names.Link,
    checked(names.Link, isKnownNode, (n, ctx) => {
      const content = ctx.inline(n.children)
      if (!validateLink(n.data.destination)) return content
      return (
        '<a' +
        attributes([['href', n.data.destination]]) +
        linkAttrs +
        (n.data.title === null ? '' : attributes([['title', n.data.title]])) +
        '>' +
        content +
        '</a>'
      )
    })
  )
  result.on(
    names.Image,
    checked(names.Image, isKnownNode, (n, ctx) => {
      if (!validateImage(n.data.destination)) return ctx.fallback(n)
      return (
        '<img' +
        attributes([
          ['src', n.data.destination],
          ['alt', imageText(n.children, ctx.source)]
        ]) +
        (n.data.title === null ? '' : attributes([['title', n.data.title]])) +
        '>'
      )
    })
  )
  result.on(
    names.Paragraph,
    checked(names.Paragraph, isKnownNode, (n, ctx) => {
      const content = ctx.inline(n.children)
      return ctx.ancestors.at(-1)?.kind === names.ListItem &&
        tightList(ctx.ancestors.at(-2))
        ? content
        : '<p>' + content + '</p>\n'
    })
  )
  result.on(
    names.Heading,
    checked(
      names.Heading,
      isKnownNode,
      (n, ctx) =>
        '<h' +
        n.data.level +
        '>' +
        ctx.inline(n.children) +
        '</h' +
        n.data.level +
        '>\n'
    )
  )
  result.on(
    names.Blockquote,
    checked(
      names.Blockquote,
      isKnownNode,
      (n, ctx) =>
        '<blockquote>' +
        (n.children?.length ? '\n' : '') +
        ctx.blocks(n.children) +
        '</blockquote>\n'
    )
  )
  result.on(
    names.List,
    checked(names.List, isKnownNode, (n, ctx) => {
      const tag = n.data.ordered ? 'ol' : 'ul'
      const attrs =
        n.data.ordered && n.data.start !== 1
          ? attributes([['start', String(n.data.start)]])
          : ''
      return (
        '<' + tag + attrs + '>\n' + ctx.blocks(n.children) + '</' + tag + '>\n'
      )
    })
  )
  result.on(
    names.ListItem,
    checked(names.ListItem, isKnownNode, (n, ctx) => {
      const children = n.children ?? []
      const tight = tightList(ctx.ancestors.at(-1))
      const content = children
        .map((child, i) => {
          const separator =
            tight &&
            i > 0 &&
            children[i - 1].kind === names.Paragraph &&
            child.kind !== names.CodeBlock
              ? '\n'
              : ''
          return separator + ctx.blocks([child])
        })
        .join('')
      return (
        '<li>' +
        (children.length && !(tight && children[0].kind === names.Paragraph)
          ? '\n'
          : '') +
        content +
        '</li>\n'
      )
    })
  )
  result.on(
    names.CodeBlock,
    checked(names.CodeBlock, isKnownNode, n => {
      const language = n.data.fenced
        ? (n.data.info ?? '')
            .replace(
              /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])|&(?:#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g,
              (match, escaped) => escaped ?? decodeHTMLStrict(match)
            )
            .trim()
            .split(/\s+/)[0]
        : ''
      const content =
        (n.data.fenced && highlight?.(n.data.literal, language)) ||
        escapeHtml(n.data.literal)
      if (content.startsWith('<pre')) return content + '\n'
      const attrs = language
        ? attributes([['class', 'language-' + language]])
        : ''
      return '<pre><code' + attrs + '>' + content + '</code></pre>\n'
    })
  )
  result.on(
    names.ThematicBreak,
    checked(names.ThematicBreak, isKnownNode, () => '<hr>\n')
  )
  result.on(
    names.HtmlInline,
    checked(names.HtmlInline, isKnownNode, n => escapeHtml(n.data.literal))
  )
  result.on(
    names.HtmlBlock,
    checked(
      names.HtmlBlock,
      isKnownNode,
      n => '<p>' + escapeHtml(n.data.literal) + '</p>\n'
    )
  )
  return result
}
export const html = Object.freeze({ plugin })
export function preset(options?: Options) {
  return new PresetBuilder().add(plugin(options)).build()
}
