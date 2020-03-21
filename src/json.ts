import json from 'markdown-it-json'
import { Store } from './Store'
import MarkdownIt from 'markdown-it'
import StateCore from 'markdown-it/lib/rules_core/state_core'

let store: Store

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (data: any): boolean => {
  if (
    typeof data['type'] !== 'string' ||
    typeof data['raw'] !== 'string' ||
    typeof data['id'] !== 'string'
  ) {
    return false
  }
  if (data['type'] === 'user' && store.getUser(data['id'])) {
    return true
  } else if (data['type'] === 'channel' && store.getChannel(data['id'])) {
    return true
  } else if (data['type'] === 'group' && store.getUserGroup(data['id'])) {
    return true
  } else if (data['type'] === 'file' || data['type'] === 'message') {
    return true
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transform = (state: StateCore, data: any): void => {
  const attributes = []
  const meta = { type: data['type'], data: '' }
  const user = store.getUser(data['id'])
  const me = store.getMe()
  const channel = store.getChannel(data['id'])
  const userGroup = store.getUserGroup(data['id'])

  if (data['type'] === 'user' && user) {
    attributes.push(['href', `javascript:openUserModal('${data['id']}')`])
    meta.data = data['id']
    if (data['id'] === me?.id) {
      attributes.push([
        'class',
        'message-user-link-highlight message-user-link'
      ])
    } else {
      attributes.push(['class', 'message-user-link'])
    }

    let t = state.push('traq_extends_link_open', 'a', 1)
    t.attrs = attributes
    t.meta = meta
    t = state.push('text', '', 0)
    t.content = data['raw']
    state.push('traq_extends_link_close', 'a', -1)
  } else if (data['type'] === 'channel' && channel) {
    attributes.push([
      'href',
      `javascript:changeChannel('${store.getChannelPath(channel.id ?? '')}')`
    ])
    attributes.push(['class', 'message-channel-link'])
    meta.data = data['raw']

    let t = state.push('traq_extends_link_open', 'a', 1)
    t.attrs = attributes
    t.meta = meta
    t = state.push('text', '', 0)
    t.content = data['raw']
    state.push('traq_extends_link_close', 'a', -1)
  } else if (data['type'] === 'group' && userGroup) {
    attributes.push(['href', `javascript:openGroupModal('${data['id']}')`])

    if (
      userGroup.members &&
      userGroup.members.filter(user => user.id === me?.id).length > 0
    ) {
      attributes.push([
        'class',
        'message-group-link-highlight message-group-link'
      ])
    } else {
      attributes.push(['class', 'message-group-link'])
    }
    meta.data = data['id']

    let t = state.push('traq_extends_link_open', 'a', 1)
    t.attrs = attributes
    t.meta = meta
    t = state.push('text', '', 0)
    t.content = data['raw']
    state.push('traq_extends_link_close', 'a', -1)
  } else if (data['type'] === 'file') {
    meta.data = data['id']

    let t = state.push('traq_extends_link_open', 'a', 1)
    t.attrs = [
      ['href', `/api/v3/files/${data['id']}`],
      ['download', data['id']]
    ]
    t.meta = meta
    t = state.push('text', '', 0)
    t.content = data['raw']
    state.push('traq_extends_link_close', 'a', -1)
  } else {
    state.push('traq_extends_plain_open', 'a', 1)
    const t = state.push('text', '', 0)
    t.content = data['raw']
    state.push('traq_extends_plain_close', 'a', -1)
  }
}

export default function messageExtendsPlugin(
  md: MarkdownIt,
  _store: Store
): void {
  store = _store
  json(validate, transform)(md)
}
