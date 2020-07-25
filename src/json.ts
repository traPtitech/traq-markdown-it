import json from 'markdown-it-json'
import type { Store } from './Store'
import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline'
import type StateBlock from 'markdown-it/lib/rules_block/state_block'

let store: Store

interface StructData {
  type: string
  raw: string
  id: string
}

interface ValidStructData extends StructData {
  type: 'user' | 'channel' | 'group' | 'file' | 'message'
}

export const isStructData = (data: Readonly<unknown>): data is StructData => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyData = data as any
  return (
    typeof anyData['type'] === 'string' &&
    typeof anyData['raw'] === 'string' &&
    typeof anyData['id'] === 'string'
  )
}

export const validate = (data: Readonly<unknown>): data is ValidStructData => {
  if (!isStructData(data)) {
    return false
  }

  const { type, id } = data
  return (
    type === 'user' ||
    (type === 'channel' && !!store.getChannel(id)) ||
    type === 'group' ||
    type === 'file' ||
    type === 'message'
  )
}

type TransformFunc = (
  state: StateBlock | StateInline,
  data: ValidStructData
) => void

const transformUser: TransformFunc = (state, { type, id, raw }) => {
  const attributes: [string, string][] = []
  const me = store.getMe()

  attributes.push(['href', `javascript:openUserModal('${id}')`])

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

  attributes.push(['href', `javascript:openGroupModal('${id}')`])

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

  attributes.push([
    'href',
    `javascript:changeChannel('${store.getChannelPath(id)}')`
  ])
  attributes.push(['class', 'message-channel-link'])

  let t = state.push('traq_extends_link_open', 'a', 1)
  t.attrs = attributes
  t.meta = { type, data: raw }
  t = state.push('text', '', 0)
  t.content = raw
  state.push('traq_extends_link_close', 'a', -1)
}

const transformFile: TransformFunc = (state, { type, id, raw }) => {
  let t = state.push('traq_extends_link_open', 'a', 1)
  t.attrs = [
    ['href', `/api/v3/files/${id}`],
    ['download', id]
  ]
  t.meta = { type, data: id }
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
  // @deprecated
  if (data.type === 'file') {
    transformFile(state, data)
    return
  }

  // @deprecated
  state.push('traq_extends_plain_open', 'a', 1)
  const t = state.push('text', '', 0)
  t.content = data.raw
  state.push('traq_extends_plain_close', 'a', -1)
}

export default function messageExtendsPlugin(
  md: MarkdownIt,
  _store: Store
): void {
  store = _store
  json(validate, transform)(md)
}
