import type { Node } from '../core/types.js'
import type { Options } from './options.js'
import { names, isKnownNode } from '@traq-markdown-parser/traq/commonmark/nodes'
import { attributes, escapeHtml, checked } from '../core/html.js'
import { Plugin } from '../core/plugin.js'

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

function titleAttribute(title: string | null) {
  return title === null ? '' : attributes([['title', title]])
}

type InlineOptions = Required<
  Pick<Options, 'validateLink' | 'validateImage' | 'breaks' | 'linkAttributes'>
>

export function registerInlineHandlers(
  result: Plugin,
  { validateLink, validateImage, breaks, linkAttributes }: InlineOptions
) {
  const linkAttrs = attributes(Object.entries(linkAttributes))

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
        titleAttribute(n.data.title) +
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
        titleAttribute(n.data.title) +
        '>'
      )
    })
  )

  result.on(
    names.HtmlInline,
    checked(names.HtmlInline, isKnownNode, n => escapeHtml(n.data.literal))
  )
}
