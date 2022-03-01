import { InlineRenderer } from '#/InlineRenderer'
import MarkdownIt from 'markdown-it'
import dedent from 'ts-dedent'

describe('InlineRenderer', () => {
  const md = new MarkdownIt()
  const ir = new InlineRenderer()
  ir.setRules()

  const render = (input: string) => {
    const tokens = md.parse(input, {})
    return ir.render(tokens, md.options, {})
  }

  const testcases = [
    {
      name: 'can render linebreak',
      input: dedent`
        aaa
        aa

        aaa



        aa
      `,
      expected: 'aaa aa aaa aa'
    },
    {
      name: 'can render codeblock',
      input: `
    code
    a
`,
      expected: dedent`
        <code>code
        a
        </code>
      `
    },
    {
      name: 'can render fenced codeblock',
      input: dedent`
        \`\`\`js
        code
        a
        \`\`\`
      `,
      expected: dedent`
        <code>code
        a
        </code>
      `
    },
    {
      name: 'can render hr',
      input: dedent`
        ---
        ***
      `,
      expected: ' ---  *** '
    },
    {
      name: 'can render header',
      input: dedent`
        # h1
        ## h2
      `,
      expected: '# h1 ## h2'
    },
    {
      name: 'can render ruled header',
      input: dedent`
        h1
        =
        h2
        h2
        -
      `,
      expected: '# h1 ## h2 h2'
    },
    {
      name: 'can render defined link',
      input: dedent`
        [link]:url 'title'

        [link]
      `,
      expected: '<a href="url" title="title">link</a>'
    },
    {
      name: 'can render paragraph',
      input: dedent`
        p1

        p2

        # h1
      `,
      expected: 'p1 p2 # h1'
    },
    {
      name: 'can render blockquote',
      input: dedent`
        > aaa
        > bbb
        ccc
      `,
      expected: '> aaa bbb ccc'
    },
    {
      name: 'can render unordered list',
      input: dedent`
        - a1
        - a2
        a2
        + b1
          + b2
        * c
      `,
      expected: '- a1 - a2 a2 + b1 + b2 * c'
    },
    {
      name: 'can render ordered list',
      input: dedent`
        1. a1
        2. a2
        a2
        1) b
        5. c
      `,
      expected: '1. a1 2. a2 a2 1) b 5. c'
    },
    {
      name: 'can render inline elements',
      input: dedent`
        *i* _i_
        **b** __b__
        ~~s~~
        [link](url 'title')
        <http://example.com>
      `,
      expected:
        '<em>i</em> <em>i</em> ' +
        '<strong>b</strong> <strong>b</strong> ' +
        '<s>s</s> ' +
        '<a href="url" title="title">link</a> ' +
        '<a href="http://example.com">http://example.com</a>'
    },
    {
      name: 'can render image',
      input: "![image](url 'title')",
      expected: '<a href="url" title="title" data-is-image>image</a>'
    },
    {
      name: 'can render table',
      input: dedent`
        | 1 | 2 |
        | - | - |
        | a | b |
        | c | d |
      `,
      expected: '| 1 | 2 | | a | b | | c | d |'
    }
  ]

  it.concurrent.each(testcases)('$name', ({ input, expected }) => {
    const actual = render(input)
    expect(actual).toStrictEqual(expected)
  })
})
