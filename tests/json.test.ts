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

  const structDataTestcases = [
    {
      name: 'empty',
      input: {},
      expected: false
    },
    {
      name: 'valid',
      input: { type: '', raw: '', id: '' },
      expected: true
    },
    {
      name: 'invalid',
      input: { type: 0, raw: '' },
      expected: false
    }
  ]

  it.concurrent.each(structDataTestcases)(
    'can validate StructData ($name)',
    ({ input, expected }) => {
      const actual = isStructData(input)
      expect(actual).toBe(expected)
    }
  )

  const validStructDataTestcases = [
    {
      name: 'empty',
      input: {},
      expected: false
    },
    {
      name: 'invalid 1',
      input: { type: '', raw: '', id: '' },
      expected: false
    },
    {
      name: 'invalid 2',
      input: { type: 0, raw: '' },
      expected: false
    },
    {
      name: 'valid',
      input: {
        type: 'user',
        raw: '@one',
        id: 'e97518db-ebb8-450f-9b4a-273234e68491'
      },
      expected: true
    }
  ]

  it.concurrent.each(validStructDataTestcases)(
    'can validate ValidStructData ($name)',
    ({ input, expected }) => {
      const actual = validate(input)
      expect(actual).toBe(expected)
    }
  )

  const renderTestcases = [
    {
      name: 'user json',
      input:
        '!{"type": "user", "raw": "@one", "id": "e97518db-ebb8-450f-9b4a-273234e68491"}',
      expected:
        '<p><a href="javascript:openUserModal(\'e97518db-ebb8-450f-9b4a-273234e68491\')" class="message-user-link">@one</a></p>'
    },
    {
      name: 'invalid user json',
      input:
        '!{"type": "user", "raw": "@invalid", "id": "00000000-0000-0000-0000-000000000000"}',
      expected:
        '<p><a href="javascript:openUserModal(\'00000000-0000-0000-0000-000000000000\')" class="message-user-link">@invalid</a></p>'
    },
    {
      name: 'usergroup json',
      input:
        '!{"type": "group", "raw": "@me", "id": "d7461966-e5d3-4c6d-9538-7c8605f45a1e"}',
      expected:
        '<p><a href="javascript:openGroupModal(\'d7461966-e5d3-4c6d-9538-7c8605f45a1e\')" class="message-group-link">@me</a></p>'
    },
    {
      name: 'usergroup includes me json',
      input:
        '!{"type": "group", "raw": "@one", "id": "e97518db-ebb8-450f-9b4a-273234e68491"}',
      expected:
        '<p><a href="javascript:openGroupModal(\'e97518db-ebb8-450f-9b4a-273234e68491\')" class="message-group-link-highlight message-group-link">@one</a></p>'
    },
    {
      name: 'invalid usergroup json',
      input:
        '!{"type": "group", "raw": "@invalid", "id": "00000000-0000-0000-0000-000000000000"}',
      expected:
        '<p><a href="javascript:openGroupModal(\'00000000-0000-0000-0000-000000000000\')" class="message-group-link">@invalid</a></p>'
    },
    {
      name: 'channel json',
      input:
        '!{"type": "channel", "raw": "#one", "id": "e97518db-ebb8-450f-9b4a-273234e68491"}',
      expected:
        '<p><a href="https://example.com/one" class="message-channel-link">#one</a></p>'
    },
    {
      name: 'invalid channel json',
      input:
        '!{"type": "channel", "raw": "#invalid", "id": "00000000-0000-0000-0000-000000000000"}',
      expected:
        '<p>!{&quot;type&quot;: &quot;channel&quot;, &quot;raw&quot;: &quot;#invalid&quot;, &quot;id&quot;: &quot;00000000-0000-0000-0000-000000000000&quot;}</p>'
    },
    {
      name: 'invalid json (1)',
      input:
        '!{"type": "message", "raw": "po", "id": "00000000-0000-0000-0000-000000000000"}',
      expected:
        '<p>!{&quot;type&quot;: &quot;message&quot;, &quot;raw&quot;: &quot;po&quot;, &quot;id&quot;: &quot;00000000-0000-0000-0000-000000000000&quot;}</p>'
    },
    {
      name: 'invalid json (2)',
      input: '!{"type": "message", "raw": "po"}',
      expected:
        '<p>!{&quot;type&quot;: &quot;message&quot;, &quot;raw&quot;: &quot;po&quot;}</p>'
    }
  ]

  it.concurrent.each(renderTestcases)(
    'can render $name',
    ({ input, expected }) => {
      const actual = md.render(input).trim()
      expect(actual).toBe(expected)
    }
  )
})
