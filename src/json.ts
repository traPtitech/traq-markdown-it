import json from 'markdown-it-json'
import type { Store } from './Store'
import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'
import type StateBlock from 'markdown-it/lib/rules_block/state_block'

let store: Readonly<Store>

interface StructData {
  type: string
  raw: string
  id: string

  [k: string]: unknown
}

interface ValidStructData extends StructData {
  type: 'user' | 'channel' | 'group'
}

export const isStructData = (
  data: Readonly<Record<string, unknown>>
): data is StructData => {
  return (
    typeof data['type'] === 'string' &&
    typeof data['raw'] === 'string' &&
    typeof data['id'] === 'string'
  )
}

export const validate = (
  data: Readonly<Record<string, unknown>>
): data is ValidStructData => {
  if (!isStructData(data)) {
    return false
  }

  const { type, id } = data
  return (
    type === 'user' ||
    (type === 'channel' && !!store.getChannel(id)) ||
    type === 'group'
  )
}

type TransformFunc = (
  state: StateBlock | StateInline,
  data: Readonly<ValidStructData>
) => void

const transformUser: TransformFunc = (state, { type, id, raw }) => {
  const attributes: [string, string][] = []
  const me = store.getMe()

  attributes.push(['href', store.generateUserHref(id)])

  if (id === me?.id) {
    attributes.push(['class', 'message-user-link-highlight message-user-link'])
  } else {
    attributes.push(['class', 'message-user-link'])
  }

  let t = state.push('traq_extends_link_open', 'a', 1)
  t.attrs = attributes
  t.meta = { type, data: id }
  t = state.push('text', '', 0)
  t.content = raw
  state.push('traq_extends_link_close', 'a', -1)
}

const transformUserGroup: TransformFunc = (state, { type, id, raw }) => {
  const attributes: [string, string][] = []
  const userGroup = store.getUserGroup(id)
  const me = store.getMe()

  attributes.push(['href', store.generateUserGroupHref(id)])

  if (userGroup?.members?.some(user => user.id === me?.id) ?? false) {
    attributes.push([
      'class',
      'message-group-link-highlight message-group-link'
    ])
  } else {
    attributes.push(['class', 'message-group-link'])
  }

  let t = state.push('traq_extends_link_open', 'a', 1)
  t.attrs = attributes
  t.meta = { type, data: id }
  t = state.push('text', '', 0)
  t.content = raw
  state.push('traq_extends_link_close', 'a', -1)
}

const transformChannel: TransformFunc = (state, { type, id, raw }) => {
  const attributes: [string, string][] = []

  attributes.push(['href', store.generateChannelHref(id)])
  attributes.push(['class', 'message-channel-link'])

  let t = state.push('traq_extends_link_open', 'a', 1)
  t.attrs = attributes
  t.meta = { type, data: raw }
  t = state.push('text', '', 0)
  t.content = raw
  state.push('traq_extends_link_close', 'a', -1)
}

const transform: TransformFunc = (state, data) => {
  if (data.type === 'user') {
    transformUser(state, data)
    return
  }
  if (data.type === 'channel' && store.getChannel(data.id)) {
    transformChannel(state, data)
    return
  }
  if (data.type === 'group') {
    transformUserGroup(state, data)
    return
  }
}

export default function messageExtendsPlugin(
  md: MarkdownIt,
  _store: Readonly<Store>
): void {
  store = _store
  json(validate, transform)(md)
}
