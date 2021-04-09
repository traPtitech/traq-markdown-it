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

  it('can render codeblock', () => {
    const actual = render(
      `
    code
    a
`
    )
    const expected = '```code a```'
    expect(actual).toStrictEqual(expected)
  })
  it('can render fenced codeblock', () => {
    const actual = render(dedent`
      \`\`\`js
      code
      a
      \`\`\`
    `)
    const expected = '```code a```'
    expect(actual).toStrictEqual(expected)
  })
  it('can render hr', () => {
    const actual = render(dedent`
      ---
      ***
    `)
    const expected = ' ---  *** '
    expect(actual).toStrictEqual(expected)
  })
  it('can render header', () => {
    const actual = render(dedent`
      # h1
      ## h2
    `)
    const expected = '# h1 ## h2'
    expect(actual).toStrictEqual(expected)
  })
  it('can render ruled header', () => {
    const actual = render(dedent`
      h1
      =
      h2
      h2
      -
    `)
    const expected = '# h1 ## h2 h2'
    expect(actual).toStrictEqual(expected)
  })
  it('can render defined link', () => {
    const actual = render(dedent`
      [link]:url 'title'

      [link]
    `)
    const expected = '<a href="url" title="title">link</a>'
    expect(actual).toStrictEqual(expected)
  })
  it('can render paragraph', () => {
    const actual = render(dedent`
      p1

      p2

      # h1
    `)
    const expected = 'p1 p2 # h1'
    expect(actual).toStrictEqual(expected)
  })
  it('can render blockquote', () => {
    const actual = render(dedent`
      > aaa
      > bbb
      ccc
    `)
    const expected = '> aaa bbb ccc'
    expect(actual).toStrictEqual(expected)
  })
  it('can render unordered list', () => {
    const actual = render(dedent`
      - a1
      - a2
      a2
      + b1
        + b2
      * c
    `)
    const expected = '- a1 - a2 a2 + b1 + b2 * c'
    expect(actual).toStrictEqual(expected)
  })
  it('can render ordered list', () => {
    const actual = render(dedent`
      1. a1
      2. a2
      a2
      1) b
      5. c
    `)
    // FIXME: https://github.com/traPtitech/traq-markdown-it/issues/294
    const expected = '. a1 . a2 a2 ) b . c'
    expect(actual).toStrictEqual(expected)
  })
  it('can render inline elements', () => {
    const actual = render(dedent`
      *i* _i_
      **b** __b__
      ~~s~~
      [link](url 'title')
      <http://example.com>
    `)
    const expected =
      '<em>i</em> <em>i</em> ' +
      '<strong>b</strong> <strong>b</strong> ' +
      '<s>s</s> ' +
      '<a href="url" title="title">link</a> ' +
      '<a href="http://example.com">http://example.com</a>'
    expect(actual).toStrictEqual(expected)
  })
  it('can render image', () => {
    const actual = render(dedent`
      ![image](url 'title')
    `)
    const expected = '<a href="url" title="title" data-is-image>image</a>'
    expect(actual).toStrictEqual(expected)
  })
})
