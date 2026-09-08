import { names, isKnownNode } from '@traq-markdown-parser/traq/trap/nodes'
import { checked } from '../core/html.js'
import { Plugin as Declaration } from '../core/definitions.js'
import { Plugin } from '../core/plugin.js'
import { validateLink as defaultPolicy } from '../commonmark/policy.js'
import { renderReference } from './reference.js'
import { stampRenderer } from './stamp.js'
import type { Options } from './types.js'

export type { Options, Store } from './types.js'

const declaration = Declaration.group('trap').new('presentation')

export function plugin({
  store,
  baseUrl,
  validateLink = defaultPolicy
}: Options = {}) {
  const result = new Plugin(declaration)

  result.on(
    names.Reference,
    checked(names.Reference, isKnownNode, node =>
      renderReference(node, store, validateLink)
    )
  )

  result.on(
    names.Spoiler,
    checked(
      names.Spoiler,
      isKnownNode,
      (n, ctx) => '<span class="spoiler">' + ctx.inline(n.children) + '</span>'
    )
  )

  result.on(
    names.BlankLine,
    checked(names.BlankLine, isKnownNode, () => '<br>\n')
  )

  const stamp = stampRenderer({ store, baseUrl })

  result.on(
    names.Stamp,
    checked(names.Stamp, isKnownNode, node => stamp(node.data.literal))
  )

  return result
}
