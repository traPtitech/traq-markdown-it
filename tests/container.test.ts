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

  it('can render container (1)', () => {
    const actual = md.render(
      dedent`
        :::success
        xxpoxx
        :::
      `
    )
    const expected = '<div class="success">\n<p>xxpoxx</p>\n</div>\n'
    expect(actual).toBe(expected)
  })
  it('can render container (2)', () => {
    const actual = md.render(
      dedent`
        :::info
        xxpoxx
        :::
      `
    )
    const expected = '<div class="info">\n<p>xxpoxx</p>\n</div>\n'
    expect(actual).toBe(expected)
  })
  it('can render container (3)', () => {
    const actual = md.render(
      dedent`
        :::invalid
        xxpoxx
        :::
      `
    )
    const expected = '<p>:::invalid\nxxpoxx\n:::</p>\n'
    expect(actual).toBe(expected)
  })

  it('can render custom container (1)', () => {
    const actual = md2.render(
      dedent`
        :::valid
        xxpoxx
        :::
      `
    )
    const expected = '<div class="valid">\n<p>xxpoxx</p>\n</div>\n'
    expect(actual).toBe(expected)
  })
  it('can render custom container (2)', () => {
    const actual = md2.render(
      dedent`
        :::invalid
        xxpoxx
        :::
      `
    )
    const expected = '<p>:::invalid\nxxpoxx\n:::</p>\n'
    expect(actual).toBe(expected)
  })
})
