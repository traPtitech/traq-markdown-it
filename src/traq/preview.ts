import type { Node, RenderContext } from '../core/types.js'
import type { Plugin } from '../core/plugin.js'
import { names, isKnownNode } from '@traq-markdown-parser/traq/commonmark/nodes'
import {
  names as genericNames,
  isKnownNode as genericNode
} from '@traq-markdown-parser/traq/generic/nodes'
import {
  names as trapNames,
  isKnownNode as trapNode
} from '@traq-markdown-parser/traq/trap/nodes'
import { attributes, checked, escapeHtml } from '../core/html.js'
import { validateLink as defaultPolicy } from '../commonmark/policy.js'
import type { Options } from './v1.js'

const blocks = (nodes: Node[] | undefined, ctx: RenderContext) =>
  (nodes ?? []).map(node => ctx.inline([node])).join(' ')

function configureCommonPreview(common: Plugin, options: Options) {
  for (const kind of [names.Softbreak, names.Hardbreak])
    common.replace(
      kind,
      checked(kind, isKnownNode, () => ' ')
    )

  common.replace(
    names.Paragraph,
    checked(names.Paragraph, isKnownNode, (n, ctx) => ctx.inline(n.children))
  )

  common.replace(
    names.Heading,
    checked(
      names.Heading,
      isKnownNode,
      (n, ctx) => '#'.repeat(n.data.level) + ' ' + ctx.inline(n.children)
    )
  )

  common.replace(
    names.Blockquote,
    checked(
      names.Blockquote,
      isKnownNode,
      (n, ctx) => '> ' + blocks(n.children, ctx)
    )
  )

  common.replace(
    names.List,
    checked(names.List, isKnownNode, (n, ctx) => blocks(n.children, ctx))
  )

  common.replace(
    names.ListItem,
    checked(
      names.ListItem,
      isKnownNode,
      (n, ctx) => n.data.marker + ' ' + blocks(n.children, ctx)
    )
  )

  common.replace(
    names.ThematicBreak,
    checked(
      names.ThematicBreak,
      isKnownNode,
      n => ' ' + escapeHtml(n.data.marker) + ' '
    )
  )

  common.replace(
    names.CodeBlock,
    checked(
      names.CodeBlock,
      isKnownNode,
      n => '<code>' + escapeHtml(n.data.literal) + '</code>'
    )
  )

  common.replace(
    names.HtmlBlock,
    checked(names.HtmlBlock, isKnownNode, n => escapeHtml(n.data.literal))
  )

  common.replace(
    names.Image,
    checked(names.Image, isKnownNode, (n, ctx) => {
      const label = escapeHtml(n.data.label_source)

      if (!(options.validateLink ?? defaultPolicy)(n.data.destination))
        return label

      return (
        '<a' +
        attributes([
          ['href', n.data.destination],
          ...(n.data.title === null
            ? []
            : [['title', n.data.title] as [string, string]])
        ]) +
        ' data-is-image>' +
        label +
        '</a>'
      )
    })
  )
}

function configureGenericPreview(generic: Plugin) {
  generic.replace(
    genericNames.Table,
    checked(genericNames.Table, genericNode, (n, ctx) =>
      (n.children ?? [])
        .map(row => {
          if (!genericNode(row) || row.kind !== genericNames.Row)
            throw new TypeError('Invalid table row')

          return (
            (row.children ?? [])
              .map(cell => {
                if (!genericNode(cell) || cell.kind !== genericNames.Cell)
                  throw new TypeError('Invalid table cell')

                return '| ' + ctx.inline(cell.children)
              })
              .join(' ') + ' |'
          )
        })
        .join(' ')
    )
  )
}

function configureTrapPreview(trap: Plugin) {
  trap.replace(
    trapNames.BlankLine,
    checked(trapNames.BlankLine, trapNode, () => ' ')
  )
}

/** A traQ message preview is a flattened document, not inline-only parsing. */
export function configurePreview(
  common: Plugin,
  generic: Plugin,
  trap: Plugin,
  options: Options
) {
  configureCommonPreview(common, options)
  configureGenericPreview(generic)
  configureTrapPreview(trap)
}
