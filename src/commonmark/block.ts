import { decodeHTMLStrict } from 'entities'
import type { Node } from '../core/types.js'
import type { Options } from './options.js'
import { names, isKnownNode } from '@traq-markdown-parser/traq/commonmark/nodes'
import { attributes, escapeHtml, checked } from '../core/html.js'
import { Plugin } from '../core/plugin.js'

function tightList(node?: Node) {
  return (
    !!node && isKnownNode(node) && node.kind === names.List && node.data.tight
  )
}

type BlockOptions = Pick<Options, 'highlight'>

function codeLanguage(info: string) {
  return info
    .replace(
      /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])|&(?:#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g,
      (match, escaped) => escaped ?? decodeHTMLStrict(match)
    )
    .trim()
    .split(/\s+/)[0]
}

export function registerBlockHandlers(
  result: Plugin,
  { highlight }: BlockOptions
) {
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
          const rendered = ctx.blocks([child])

          // A line break following a tight paragraph needs no leading whitespace.
          const separator =
            tight &&
            i > 0 &&
            children[i - 1].kind === names.Paragraph &&
            child.kind !== names.CodeBlock &&
            !rendered.startsWith('<br>')
              ? '\n'
              : ''

          return separator + rendered
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
      const language = n.data.fenced ? codeLanguage(n.data.info ?? '') : ''
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
    names.HtmlBlock,
    checked(
      names.HtmlBlock,
      isKnownNode,
      n => '<p>' + escapeHtml(n.data.literal) + '</p>\n'
    )
  )
}
