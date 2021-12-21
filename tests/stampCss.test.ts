import MarkdownIt from 'markdown-it'
import { stampCssPlugin } from '#/stampCss'
import dedent from 'ts-dedent'

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
    const actual = md.render(
      dedent`
        :xx:
      `
    )
    const expected = '<p><i class="emoji s32 e_xx" title=":xx:">:xx:</i></p>\n'
    expect(actual).toBe(expected)
  })
  it('can render stamp (2)', () => {
    const actual = md.render(
      dedent`
        :po;
      `
    )
    const expected = '<p><i class="emoji s16 e_po" title=":po;">:po;</i></p>\n'
    expect(actual).toBe(expected)
  })
  it('can render stamp (3)', () => {
    const actual = md.render(
      dedent`
        :invalid:
      `
    )
    const expected = '<p>:invalid:</p>\n'
    expect(actual).toBe(expected)
  })
  it('can render stamp with size disabled', () => {
    const actual = mdSizeDisabled.render(
      dedent`
        :xx:
      `
    )
    const expected = '<p><i class="emoji s24 e_xx" title=":xx:">:xx:</i></p>\n'
    expect(actual).toBe(expected)
  })

  it('can render user stamp (1)', () => {
    const actual = md.render(
      dedent`
        :@user:
      `
    )
    const expected =
      '<p><i class="emoji s32" title=":@user:" style="background-image: url(https://q.trap.jp/api/v3/public/icon/user)">:@user:</i></p>\n'
    expect(actual).toBe(expected)
  })
  it('can render user stamp (2)', () => {
    const actual = md.render(
      dedent`
        :@Webhook#user:
      `
    )
    const expected = '<p>:@Webhook#user:</p>\n'
    expect(actual).toBe(expected)
  })
  it('can render user stamp with size disabled', () => {
    const actual = mdSizeDisabled.render(
      dedent`
        :@user:
      `
    )
    const expected =
      '<p><i class="emoji s24" title=":@user:" style="background-image: url(https://q.trap.jp/api/v3/public/icon/user)">:@user:</i></p>\n'
    expect(actual).toBe(expected)
  })

  {
    const parseAndExtractFirstMatch = (input: string) =>
      md.parse(input, {})[1]?.children?.[0]?.meta.match[0]

    it('should have meta with no effect', () => {
      const actual = parseAndExtractFirstMatch(':one:')
      const expected = ':one:'
      expect(actual).toBe(expected)
    })

    it('should have meta with size effect', () => {
      const actual = parseAndExtractFirstMatch(':one.large:')
      const expected = ':one.large:'
      expect(actual).toBe(expected)
    })

    it('should have meta with anime effect', () => {
      const actual = parseAndExtractFirstMatch(':one.wiggle:')
      const expected = ':one.wiggle:'
      expect(actual).toBe(expected)
    })
  }
})
