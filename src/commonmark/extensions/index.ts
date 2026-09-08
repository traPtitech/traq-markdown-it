import type { Node, RenderContext } from '../../core/types.js'
import type { RowData } from '@traq-markdown-parser/traq/generic/nodes'
import { names, isKnownNode } from '@traq-markdown-parser/traq/generic/nodes'
import { attributes, checked } from '../../core/html.js'
import { Plugin as Declaration } from '../../core/definitions.js'
import { Plugin } from '../../core/plugin.js'
import { math as defaultMath } from './math.js'

export interface Options {
  /** Return trusted HTML. KaTeX is used by default. */
  math?(tex: string, displayMode: boolean): string
}

function table(node: Node, ctx: RenderContext) {
  const rows = (node.children ?? []).map(row => {
    if (!isKnownNode(row) || row.kind !== names.Row)
      throw new TypeError('Invalid table row')

    return row
  })
  const row = (node: Node & { data: RowData }) =>
    '<tr>\n' +
    (node.children ?? [])
      .map(cell => {
        if (!isKnownNode(cell) || cell.kind !== names.Cell)
          throw new TypeError('Invalid table cell')

        const tag = node.data.header ? 'th' : 'td'
        const attrs = cell.data.alignment
          ? attributes([['style', 'text-align:' + cell.data.alignment]])
          : ''
        return (
          '<' +
          tag +
          attrs +
          '>' +
          ctx.inline(cell.children) +
          '</' +
          tag +
          '>\n'
        )
      })
      .join('') +
    '</tr>\n'

  const head = rows.filter(r => r.data.header),
    body = rows.filter(r => !r.data.header)
  return (
    '<table>\n<thead>\n' +
    head.map(row).join('') +
    '</thead>\n' +
    (body.length ? '<tbody>\n' + body.map(row).join('') + '</tbody>\n' : '') +
    '</table>\n'
  )
}

const declaration = Declaration.group('generic').new('presentation')

export function plugin({ math = defaultMath }: Options = {}) {
  const result = new Plugin(declaration)

  result.on(
    names.Mark,
    checked(
      names.Mark,
      isKnownNode,
      (n, ctx) => '<mark>' + ctx.inline(n.children) + '</mark>'
    )
  )
  result.on(
    names.Strikethrough,
    checked(
      names.Strikethrough,
      isKnownNode,
      (n, ctx) => '<s>' + ctx.inline(n.children) + '</s>'
    )
  )
  result.on(names.Table, checked(names.Table, isKnownNode, table))
  result.on(
    names.InlineMath,
    checked(names.InlineMath, isKnownNode, node => math(node.data.tex, false))
  )
  result.on(
    names.BlockMath,
    checked(names.BlockMath, isKnownNode, node => math(node.data.tex, true))
  )
  return result
}
