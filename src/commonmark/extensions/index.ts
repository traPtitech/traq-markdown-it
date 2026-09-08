export interface Options {
  /** Return trusted HTML. KaTeX is used by default. */
  math?(tex: string, displayMode: boolean): string
}
import type { Node } from '../../core/types.js'
import type { TokenContext } from '../../core/tokens.js'
import type { RowData } from '@traq-markdown-parser/ts/generic/nodes'
import { names, isKnownNode } from '@traq-markdown-parser/ts/generic/nodes'
import { pair, inlineToken, tokenHandler, checked } from '../../core/tokens.js'
import { Plugin as Declaration } from '@traq-markdown-parser/ts/definitions'
import { Plugin } from '../../core/plugin.js'
import { math as defaultMath } from './math.js'

function table(node: Node, ctx: TokenContext) {
  const rows = (node.children ?? []).map(row => {
    if (!isKnownNode(row) || row.kind !== names.Row)
      throw new TypeError('Invalid table row')
    return row
  })
  const row = (node: Node & { data: RowData }) =>
    pair(
      'tr',
      'tr',
      (node.children ?? []).flatMap(cell => {
        if (!isKnownNode(cell) || cell.kind !== names.Cell)
          throw new TypeError('Invalid table cell')
        const tag = node.data.header ? 'th' : 'td'
        return pair(tag, tag, [inlineToken(ctx.inline(cell.children))], {
          block: true,
          attrs: cell.data.alignment
            ? [['style', 'text-align:' + cell.data.alignment]]
            : null
        })
      }),
      { block: true }
    )
  const head = rows.filter(r => r.data.header),
    body = rows.filter(r => !r.data.header)
  return pair(
    'table',
    'table',
    [
      ...pair('thead', 'thead', head.flatMap(row), { block: true }),
      ...(body.length
        ? pair('tbody', 'tbody', body.flatMap(row), { block: true })
        : [])
    ],
    { block: true }
  )
}
const declaration = Declaration.group('generic').new('presentation')
export function plugin({ math = defaultMath }: Options = {}) {
  const result = new Plugin(declaration)
  result.on(
    names.Mark,
    tokenHandler(
      checked(names.Mark, isKnownNode, (n, ctx) =>
        pair('mark', 'mark', ctx.inline(n.children))
      )
    )
  )
  result.on(
    names.Strikethrough,
    tokenHandler(
      checked(names.Strikethrough, isKnownNode, (n, ctx) =>
        pair('s', 's', ctx.inline(n.children))
      )
    )
  )
  result.on(names.Table, tokenHandler(checked(names.Table, isKnownNode, table)))
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
