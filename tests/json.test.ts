import MarkdownIt from 'markdown-it'
import jsonPlugin, { isStructData, validate } from '#/json'
import { Store } from '#/Store'

const setup = () => {
  const md = new MarkdownIt()

  const nameIdTable: Record<string, string> = {
    me: 'd7461966-e5d3-4c6d-9538-7c8605f45a1e',
    one:'e97518db-ebb8-450f-9b4a-273234e68491',
    longlonglonglonglonglonglonglonglonglonglonglong:'e97518db-ebb8-450f-9b4a-273234e68491',
    'Webhook#random-Va1ue':'e97518db-ebb8-450f-9b4a-273234e68491'
  }

  const store: Store = {
    getChannel: id => ({ id }),
    getChannelPath: id => `/channels/${Object.entries(nameIdTable).find(([, v]) => v === id)?.[0] ?? ''}`,
    getMe: () => ({ id: nameIdTable.me }),
    getUser: id => ({id}),
    getUserGroup: id => ({ id, members: [] }),
    getUserByName: name => nameIdTable[name] ? ({ iconFileId: nameIdTable[name] }) : undefined,
    getStampByName: name => nameIdTable[name] ? ({ name, fileId: nameIdTable[name] }) : undefined
  }

  jsonPlugin(md, store)
  return md
}

describe('json', () => {
  const md = setup()

  it('can validate StructData (1)', () => {
    const actual = isStructData({})
    const expected = false
    expect(actual).toBe(expected)
  })
  it('can validate StructData (2)', () => {
    const actual = isStructData({ type: '', raw: '', id: '' })
    const expected = true
    expect(actual).toBe(expected)
  })
  it('can validate StructData (3)', () => {
    const actual = isStructData({ type: 0, raw: '' })
    const expected = false
    expect(actual).toBe(expected)
  })

  it('can validate ValidStructData (1)', () => {
    const actual = validate({})
    const expected = false
    expect(actual).toBe(expected)
  })
  it('can validate ValidStructData (2)', () => {
    const actual = validate({ type: '', raw: '', id: '' })
    const expected = false
    expect(actual).toBe(expected)
  })
  it('can validate ValidStructData (3)', () => {
    const actual = validate({ type: 0, raw: '' })
    const expected = false
    expect(actual).toBe(expected)
  })
  it('can validate ValidStructData (4)', () => {
    const actual = validate({ type: 'user', raw: '@one', id: 'e97518db-ebb8-450f-9b4a-273234e68491' })
    const expected = true
    expect(actual).toBe(expected)
  })

  it('can render user json', () => {
    const actual = md.render('!{"type": "user", "raw": "@one", "id": "e97518db-ebb8-450f-9b4a-273234e68491"}').trim()
    const expected = '<p><a href="javascript:openUserModal(\'e97518db-ebb8-450f-9b4a-273234e68491\')" class="message-user-link">@one</a></p>'
    expect(actual).toBe(expected)
  })
  it('can render me json', () => {
    const actual = md.render('!{"type": "user", "raw": "@me", "id": "d7461966-e5d3-4c6d-9538-7c8605f45a1e"}').trim()
    const expected = '<p><a href="javascript:openUserModal(\'d7461966-e5d3-4c6d-9538-7c8605f45a1e\')" class="message-user-link-highlight message-user-link">@me</a></p>'
    expect(actual).toBe(expected)
  })

  // TODO
})
