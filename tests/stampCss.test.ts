import MarkdownIt from 'markdown-it'
import { stampCssPlugin } from '#/stampCss'

const setup = () => {
  const md = new MarkdownIt()

  stampCssPlugin(md, ['xx', 'po', 'xx+po+xx'])
  return md
}

describe('container', () => {
  const md = setup()

  it('can render stamp (1)', () => {
    const actual = md
      .render(
        `
:xx:
    `
      )
      .trim()
    const expected = '<p><i class="emoji s32 e_xx" title=":xx:">:xx:</i></p>'
    expect(actual).toBe(expected)
  })
  it('can render stamp (2)', () => {
    const actual = md
      .render(
        `
:po;
    `
      )
      .trim()
    const expected = '<p><i class="emoji s16 e_po" title=":po;">:po;</i></p>'
    expect(actual).toBe(expected)
  })
  it('can render stamp (3)', () => {
    const actual = md
      .render(
        `
:invalid:
    `
      )
      .trim()
    const expected = '<p>:invalid:</p>'
    expect(actual).toBe(expected)
  })
})
