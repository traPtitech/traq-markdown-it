import Md, { Store } from '#/index'

const setup = () => {
  const nameIdTable: Record<string, string> = {
    me: 'd7461966-e5d3-4c6d-9538-7c8605f45a1e',
    one:'e97518db-ebb8-450f-9b4a-273234e68491',
    longlonglonglonglonglonglonglonglonglonglonglong:'e97518db-ebb8-450f-9b4a-273234e68491',
    'Webhook#random-Va1ue':'e97518db-ebb8-450f-9b4a-273234e68491'
  }

  const store: Store = {
    getChannel: id => id !== '00000000-0000-0000-0000-000000000000' ? ({ id }) : undefined,
    getChannelPath: id => Object.entries(nameIdTable).find(([, v]) => v === id)?.[0] ?? '',
    getMe: () => ({ id: nameIdTable.me }),
    getUser: id => ({id}),
    getUserGroup: id => ({ id, members: id === nameIdTable.one ? [{ id: nameIdTable.me, role: '' }] : [] }),
    getUserByName: name => nameIdTable[name] ? ({ iconFileId: nameIdTable[name] }) : undefined,
    getStampByName: name => nameIdTable[name] ? ({ name, fileId: nameIdTable[name] }) : undefined
  }

  const md = new Md(store, [], 'https://example.com')

  return md
}

describe('index', () => {
  const md = setup()

  it('can render', () => {
    const actual = md.render(`
**po**
:xx:
!!x!!
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
`
    )
    const expected = {
      embeddings: [{
        "endIndex": 84,
        "id": "e97518db-ebb8-450f-9b4a-273234e68491",
        "startIndex": 19,
        "type": "message",
      }],
      rawText: `
**po**
:xx:
!!x!!
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
`,
      text: `
**po**
:xx:
!!x!!
`,
      renderedText: `<br>
<p><strong>po</strong><br>
:xx:<br>
<span class="spoiler">x</span></p>
`
    }
    expect(actual).toStrictEqual(expected)
  })

  it('can render inline (1)', () => {
    const actual = md.renderInline(`
**po**
:xx:
!!x!!
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
`
    )
    const expected = {
      embeddings: [{
        "endIndex": 84,
        "id": "e97518db-ebb8-450f-9b4a-273234e68491",
        "startIndex": 19,
        "type": "message",
      }],
      rawText: `
**po**
:xx:
!!x!!
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
`,
      text: `
**po**
:xx:
!!x!!
`,
      renderedText: ` po :xx: <span class="spoiler">x</span> `
    }
    expect(actual).toStrictEqual(expected)
  })
  it('can render inline (2)', () => {
    const actual = md.renderInline(`
- a!!aaa
- a!!aa
`
    )
    const expected = {
      embeddings: [],
      rawText: `
- a!!aaa
- a!!aa
`,
      text: `
- a!!aaa
- a!!aa
`,
      renderedText: ` - a!!aaa - a!!aa `
    }
    expect(actual).toStrictEqual(expected)
  })
})
