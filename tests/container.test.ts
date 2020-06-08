import MarkdownIt from 'markdown-it'
import { useContainer } from '#/container'

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
    const actual = md.render(`
:::success
xxpoxx
:::
    `).trim()
    const expected = '<div class="success">\n<p>xxpoxx</p>\n</div>'
    expect(actual).toBe(expected)
  })
  it('can render container (2)', () => {
    const actual = md.render(`
:::info
xxpoxx
:::
    `).trim()
    const expected = '<div class="info">\n<p>xxpoxx</p>\n</div>'
    expect(actual).toBe(expected)
  })
  it('can render container (3)', () => {
    const actual = md.render(`
:::invalid
xxpoxx
:::
    `).trim()
    const expected = '<p>:::invalid\nxxpoxx\n:::</p>'
    expect(actual).toBe(expected)
  })

  it('can render custom container (1)', () => {
    const actual = md2.render(`
:::valid
xxpoxx
:::
    `).trim()
    const expected = '<div class="valid">\n<p>xxpoxx</p>\n</div>'
    expect(actual).toBe(expected)
  })
  it('can render custom container (2)', () => {
    const actual = md2.render(`
:::invalid
xxpoxx
:::
    `).trim()
    const expected = '<p>:::invalid\nxxpoxx\n:::</p>'
    expect(actual).toBe(expected)
  })
})
