import { setup } from './setupMd'
import dedent from 'ts-dedent'

describe('index', () => {
  const { md } = setup()

  it('can render', () => {
    const actual = md.render(
      dedent(`
        **po**
        :xx:
        [message link](https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491)
        \`https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68492\`
        \`\`\`
        https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68493
        \`\`\`
        !!https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68494!!
        !!x!!
        https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68495
      `)
    )
    const expected = {
      embeddings: [
        {
          id: 'e97518db-ebb8-450f-9b4a-273234e68491',
          type: 'message'
        },
        {
          id: 'e97518db-ebb8-450f-9b4a-273234e68495',
          type: 'message'
        }
      ],
      rawText: dedent(`
        **po**
        :xx:
        [message link](https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491)
        \`https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68492\`
        \`\`\`
        https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68493
        \`\`\`
        !!https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68494!!
        !!x!!
        https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68495
      `)
    }

    expect(actual).toMatchObject(expected)
    expect(actual.embeddings).toStrictEqual(expected.embeddings)
    expect(actual.rawText).toBe(expected.rawText)
    expect(actual.renderedText).toMatchSnapshot()
  })

  const inlineTestcases = [
    {
      input: dedent`
        **po**
        :xx:
        :me:
        ==x==
        !!x!!
        https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
      `,
      expected: {
        embeddings: [
          {
            id: 'e97518db-ebb8-450f-9b4a-273234e68491',
            type: 'message'
          }
        ]
      }
    },
    {
      input: dedent`
        - a!!aaa
        - a!!aa
      `,
      expected: {
        embeddings: []
      }
    },
    {
      input: dedent`
        !!p
        o!!

        !!
        po
        !!
      `,
      expected: {
        embeddings: []
      }
    },
    {
      input: dedent`
        aaa
        aa

        aaa



        aa
      `,
      expected: {
        embeddings: []
      }
    },
    {
      input: dedent`
        $\\KaTeX$
        $\\frac{\\pi}{55555}$
      `,
      expected: {
        embeddings: []
      }
    },
    {
      input: dedent`
        $$
        \\Huge not huge
        \\huge not huge
        \\LARGE not large
        \\Large not large
        \\large not large
        \\rule{500em}{500em}
        $$
      `,
      expected: {
        embeddings: []
      }
    },
    {
      input: dedent`
        $$
        \\KaTeX
        $$
      `,
      expected: {
        embeddings: []
      }
    },
    {
      input: dedent`
        example.dev
        example.show
      `,
      expected: {
        embeddings: [
          {
            type: 'url',
            url: 'http://example.dev'
          },
          {
            type: 'url',
            url: 'http://example.show'
          }
        ]
      }
    }
  ]

  it.concurrent.each(inlineTestcases)(
    'can render inline',
    ({ input, expected }) => {
      const actual = md.renderInline(input)
      expect(actual.embeddings).toStrictEqual(expected.embeddings)
      expect(actual.rawText).toBe(input)
      expect(actual.renderedText).toMatchSnapshot()
    }
  )
})
