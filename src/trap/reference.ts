import type { Node } from '../core/types.js'
import type { ReferenceData } from '@traq-markdown-parser/traq/trap/nodes'
import { attributes, escapeHtml } from '../core/html.js'
import type { Options } from './types.js'

export function renderReference(
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
