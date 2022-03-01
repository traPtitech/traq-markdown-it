import MarkdownIt from 'markdown-it'
import { useContainer } from '#/container'
import dedent from 'ts-dedent'

const setup = () => {
  const md = new MarkdownIt()

  useContainer(md)
  return md
}
const setup2 = () => {
  const md = new MarkdownIt()

  useContainer(md, ['valid'])
  return md
}

describe('container', () => {
  const md = setup()
  const md2 = setup2()

  const testcases = [
    {
      name: 'success',
      md: md,
      input: dedent`
              :::success
              xxpoxx
              :::
            `,
      expected: '<div class="success">\n<p>xxpoxx</p>\n</div>\n'
    },
    {
      name: 'info',
      md: md,
      input: dedent`
              :::info
              xxpoxx
              :::
            `,
      expected: '<div class="info">\n<p>xxpoxx</p>\n</div>\n'
    },
    {
      name: 'invalid',
      md: md,
      input: dedent`
              :::invalid
              xxpoxx
              :::
            `,
      expected: '<p>:::invalid\nxxpoxx\n:::</p>\n'
    },
    {
      name: 'custom valid',
      md: md2,
      input: dedent`
              :::valid
              xxpoxx
              :::
            `,
      expected: '<div class="valid">\n<p>xxpoxx</p>\n</div>\n'
    },
    {
      name: 'custom invalid',
      md: md2,
      input: dedent`
              :::invalid
              xxpoxx
              :::
            `,
      expected: '<p>:::invalid\nxxpoxx\n:::</p>\n'
    }
  ]

  it.concurrent.each(testcases)(
    'can render container (%name)',
    ({ md, input, expected }) => {
      const actual = md.render(input)
      expect(actual).toBe(expected)
    }
  )
})
