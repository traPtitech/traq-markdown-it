import type { Node } from '../core/types.js'
import type { ReferenceData } from '@traq-markdown-parser/traq/trap/nodes'
export interface Store {
  getMe?(): Readonly<{ id: string }> | undefined
  getUserGroup?(
    id: string
  ): Readonly<{ members: readonly Readonly<{ id: string }>[] }> | undefined
  getStampByName?(
    name: string
  ): Readonly<{ name: string; fileId: string }> | undefined
  getUserByName?(name: string): Readonly<{ iconFileId: string }> | undefined
  generateUserHref?(id: string): string
  generateUserGroupHref?(id: string): string
  generateChannelHref?(id: string): string
  generateStampHref?(fileId: string): string
}
export interface Options {
  store?: Readonly<Store>
  baseUrl?: string
  validateLink?(destination: string): boolean
}
import { names, isKnownNode } from '@traq-markdown-parser/traq/trap/nodes'
import { token, pair, tokenHandler, checked } from '../core/tokens.js'
import { Plugin as Declaration } from '../core/definitions.js'
import { Plugin } from '../core/plugin.js'
import { stampRenderer } from './stamp.js'
import { validateLink as defaultPolicy } from '../commonmark/policy.js'

function reference(
  node: Node & { data: ReferenceData },
  store: Options['store'],
  validateLink: (destination: string) => boolean
) {
  const { type, id, label } = node.data
  if (!store) return [token('text', '', 0, label)]
  const me = store.getMe?.()
  const href =
    type === 'user'
      ? store.generateUserHref?.(id)
      : type === 'group'
        ? store.generateUserGroupHref?.(id)
        : store.generateChannelHref?.(id)
  if (!href || !validateLink(href)) return [token('text', '', 0, label)]
  const highlight =
    type === 'user'
      ? id === me?.id
      : type === 'group' &&
        (store.getUserGroup?.(id)?.members?.some(u => u.id === me?.id) ?? false)
  const cls = `message-${type}-link`
  const tokens = pair('traq_extends_link', 'a', [token('text', '', 0, label)], {
    attrs: [
      ['href', href],
      ['class', highlight ? `${cls}-highlight ${cls}` : cls]
    ]
  })
  tokens[0].meta = { type, data: type === 'channel' ? label : id }
  return tokens
}
const declaration = Declaration.group('trap').new('presentation')
export function plugin({
  store,
  baseUrl,
  validateLink = defaultPolicy
}: Options = {}) {
  const result = new Plugin(declaration)
  result.on(
    names.Reference,
    tokenHandler(
      checked(names.Reference, isKnownNode, node =>
        reference(node, store, validateLink)
      )
    )
  )
  result.on(
    names.Spoiler,
    tokenHandler(
      checked(names.Spoiler, isKnownNode, (n, ctx) =>
        pair('spoiler', 'span', ctx.inline(n.children), {
          attrs: [['class', 'spoiler']],
          markup: '!!'
        })
      )
    )
  )
  result.on(
    names.BlankLine,
    tokenHandler(
      checked(names.BlankLine, isKnownNode, () => [token('hardbreak', 'br')])
    )
  )
  const stamp = stampRenderer({ store, baseUrl })
  result.on(
    names.Stamp,
    checked(names.Stamp, isKnownNode, node => stamp(node.data.literal))
  )
  return result
}
