import type { Node } from '../core/types.js'
import type { TokenContext } from '../core/tokens.js'
import type { List as ListData } from '@traq-markdown-parser/traq/commonmark/nodes'
/** Hide only paragraphs directly inside items of this tight list.
 * Nested lists and blockquotes own the paragraphs inside their containers.
 */
export function listChildren(
  node: Node & { data: ListData },
  context: TokenContext
) {
  const tokens = context.blocks(node.children)
  if (!node.data.tight) return tokens
  const parents: string[] = []
  for (const token of tokens) {
    if (token.nesting < 0) parents.pop()
    if (
      (token.type === 'paragraph_open' || token.type === 'paragraph_close') &&
      parents.length === 1 &&
      parents[0] === 'list_item_open'
    )
      token.hidden = true
    if (token.nesting > 0) parents.push(token.type)
  }
  return tokens
}
