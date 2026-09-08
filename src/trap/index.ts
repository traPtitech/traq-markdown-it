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
import { attributes, escapeHtml, checked } from '../core/html.js'
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
  if (!store) return escapeHtml(label)
  const me = store.getMe?.()
  const href =
    type === 'user'
      ? store.generateUserHref?.(id)
      : type === 'group'
        ? store.generateUserGroupHref?.(id)
        : store.generateChannelHref?.(id)
  if (!href || !validateLink(href)) return escapeHtml(label)
  const highlight =
    type === 'user'
      ? id === me?.id
      : type === 'group' &&
        (store.getUserGroup?.(id)?.members?.some(u => u.id === me?.id) ?? false)
  const cls = `message-${type}-link`
  return (
    '<a' +
    attributes([
      ['href', href],
      ['class', highlight ? `${cls}-highlight ${cls}` : cls]
    ]) +
    '>' +
    escapeHtml(label) +
    '</a>'
  )
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
    checked(names.Reference, isKnownNode, node =>
      reference(node, store, validateLink)
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
