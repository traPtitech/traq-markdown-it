import jsonPlugin, { isStructData, validate } from '#/json'
import { setup } from './setupMd'

const setupWithJson = () => {
  const { md, store } = setup()

  jsonPlugin(md.md, store)
  return { md, store }
}

describe('json', () => {
  const { md: traQMd } = setupWithJson()
  const md = traQMd.md

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
    const actual = validate({
      type: 'user',
      raw: '@one',
      id: 'e97518db-ebb8-450f-9b4a-273234e68491'
    })
    const expected = true
    expect(actual).toBe(expected)
  })

  it('can render user json', () => {
    const actual = md
      .render(
        '!{"type": "user", "raw": "@one", "id": "e97518db-ebb8-450f-9b4a-273234e68491"}'
      )
      .trim()
    const expected =
      '<p><a href="javascript:openUserModal(\'e97518db-ebb8-450f-9b4a-273234e68491\')" class="message-user-link">@one</a></p>'
    expect(actual).toBe(expected)
  })
  it('can render me json', () => {
    const actual = md
      .render(
        '!{"type": "user", "raw": "@me", "id": "d7461966-e5d3-4c6d-9538-7c8605f45a1e"}'
      )
      .trim()
    const expected =
      '<p><a href="javascript:openUserModal(\'d7461966-e5d3-4c6d-9538-7c8605f45a1e\')" class="message-user-link-highlight message-user-link">@me</a></p>'
    expect(actual).toBe(expected)
  })
  it('can render invalid user json', () => {
    const actual = md
      .render(
        '!{"type": "user", "raw": "@invalid", "id": "00000000-0000-0000-0000-000000000000"}'
      )
      .trim()
    const expected =
      '<p><a href="javascript:openUserModal(\'00000000-0000-0000-0000-000000000000\')" class="message-user-link">@invalid</a></p>'
    expect(actual).toBe(expected)
  })

  it('can render usergroup json', () => {
    const actual = md
      .render(
        '!{"type": "group", "raw": "@me", "id": "d7461966-e5d3-4c6d-9538-7c8605f45a1e"}'
      )
      .trim()
    const expected =
      '<p><a href="javascript:openGroupModal(\'d7461966-e5d3-4c6d-9538-7c8605f45a1e\')" class="message-group-link">@me</a></p>'
    expect(actual).toBe(expected)
  })
  it('can render usergroup includes me json', () => {
    const actual = md
      .render(
        '!{"type": "group", "raw": "@one", "id": "e97518db-ebb8-450f-9b4a-273234e68491"}'
      )
      .trim()
    const expected =
      '<p><a href="javascript:openGroupModal(\'e97518db-ebb8-450f-9b4a-273234e68491\')" class="message-group-link-highlight message-group-link">@one</a></p>'
    expect(actual).toBe(expected)
  })
  it('can render invalid usergroup json', () => {
    const actual = md
      .render(
        '!{"type": "group", "raw": "@invalid", "id": "00000000-0000-0000-0000-000000000000"}'
      )
      .trim()
    const expected =
      '<p><a href="javascript:openGroupModal(\'00000000-0000-0000-0000-000000000000\')" class="message-group-link">@invalid</a></p>'
    expect(actual).toBe(expected)
  })

  it('can render channel json', () => {
    const actual = md
      .render(
        '!{"type": "channel", "raw": "#one", "id": "e97518db-ebb8-450f-9b4a-273234e68491"}'
      )
      .trim()
    const expected =
      '<p><a href="javascript:changeChannel(\'one\')" class="message-channel-link">#one</a></p>'
    expect(actual).toBe(expected)
  })
  it('can render invalid channel json', () => {
    const actual = md
      .render(
        '!{"type": "channel", "raw": "#invalid", "id": "00000000-0000-0000-0000-000000000000"}'
      )
      .trim()
    const expected =
      '<p>!{&quot;type&quot;: &quot;channel&quot;, &quot;raw&quot;: &quot;#invalid&quot;, &quot;id&quot;: &quot;00000000-0000-0000-0000-000000000000&quot;}</p>'
    expect(actual).toBe(expected)
  })

  it('can render invalid json (1)', () => {
    const actual = md
      .render(
        '!{"type": "message", "raw": "po", "id": "00000000-0000-0000-0000-000000000000"}'
      )
      .trim()
    const expected =
      '<p>!{&quot;type&quot;: &quot;message&quot;, &quot;raw&quot;: &quot;po&quot;, &quot;id&quot;: &quot;00000000-0000-0000-0000-000000000000&quot;}</p>'
    expect(actual).toBe(expected)
  })
  it('can render invalid json (2)', () => {
    const actual = md.render('!{"type": "message", "raw": "po"}').trim()
    const expected =
      '<p>!{&quot;type&quot;: &quot;message&quot;, &quot;raw&quot;: &quot;po&quot;}</p>'
    expect(actual).toBe(expected)
  })
})
