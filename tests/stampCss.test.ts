import MarkdownIt from 'markdown-it'
import { stampCssPlugin } from '#/stampCss'

const setup = () => {
  const md = new MarkdownIt()

  stampCssPlugin(md, ['xx', 'po', 'xx+po+xx'], true)
  return md
}
const setupSizeDisabled = () => {
  const md = new MarkdownIt()

  stampCssPlugin(md, ['xx', 'po', 'xx+po+xx'])
  return md
}

describe('container', () => {
  const md = setup()
  const mdSizeDisabled = setupSizeDisabled()

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
  it('can render stamp with size disabled', () => {
    const actual = mdSizeDisabled
      .render(
        `
:xx:
    `
      )
      .trim()
    const expected = '<p><i class="emoji s24 e_xx" title=":xx:">:xx:</i></p>'
    expect(actual).toBe(expected)
  })

  it('can render user stamp (1)', () => {
    const actual = md
      .render(
        `
:@user:
    `
      )
      .trim()
    const expected =
      '<p><i class="emoji s32" title=":@user:" style="background-image: url(https://q.trap.jp/api/v3/public/icon/user)">:@user:</i></p>'
    expect(actual).toBe(expected)
  })
  it('can render user stamp (2)', () => {
    const actual = md
      .render(
        `
:@Webhook#user:
    `
      )
      .trim()
    const expected = '<p>:@Webhook#user:</p>'
    expect(actual).toBe(expected)
  })
  it('can render user stamp with size disabled', () => {
    const actual = mdSizeDisabled
      .render(
        `
:@user:
    `
      )
      .trim()
    const expected =
      '<p><i class="emoji s24" title=":@user:" style="background-image: url(https://q.trap.jp/api/v3/public/icon/user)">:@user:</i></p>'
    expect(actual).toBe(expected)
  })
})
