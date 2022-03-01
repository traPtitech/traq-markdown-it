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

describe('stampCss', () => {
  const md = setup()
  const mdSizeDisabled = setupSizeDisabled()

  const testcases = [
    {
      name: 'stamp (1)',
      md: md,
      input: dedent`
        :xx:
      `,
      expected: '<p><i class="emoji s32 e_xx" title=":xx:">:xx:</i></p>\n'
    },
    {
      name: 'stamp (2)',
      md: md,
      input: dedent`
        :po;
      `,
      expected: '<p><i class="emoji s16 e_po" title=":po;">:po;</i></p>\n'
    },
    {
      name: 'stamp (3)',
      md: md,
      input: dedent`
        :invalid:
      `,
      expected: '<p>:invalid:</p>\n'
    },
    {
      name: 'stamp with size disabled',
      md: mdSizeDisabled,
      input: dedent`
        :xx:
      `,
      expected: '<p><i class="emoji s24 e_xx" title=":xx:">:xx:</i></p>\n'
    },
    {
      name: 'user stamp (1)',
      md: md,
      input: dedent`
        :@user:
      `,
      expected:
        '<p><i class="emoji s32" title=":@user:" style="background-image: url(https://q.trap.jp/api/v3/public/icon/user)">:@user:</i></p>\n'
    },
    {
      name: 'user stamp (2)',
      md: md,
      input: dedent`
        :@Webhook#user:
      `,
      expected: '<p>:@Webhook#user:</p>\n'
    },
    {
      name: 'user stamp with size disabled',
      md: mdSizeDisabled,
      input: dedent`
        :@user:
      `,
      expected:
        '<p><i class="emoji s24" title=":@user:" style="background-image: url(https://q.trap.jp/api/v3/public/icon/user)">:@user:</i></p>\n'
    }
  ]

  it.concurrent.each(testcases)(
    'can render $name',
    ({ md, input, expected }) => {
      const actual = md.render(input)
      expect(actual).toBe(expected)
    }
  )

  {
    const parseAndExtractFirstMatch = (input: string) =>
      md.parse(input, {})[1]?.children?.[0]?.meta.match[0]

    const testcases = [
      { name: 'no effect', input: ':one:' },
      { name: 'size effect', input: ':one.large:' },
      { name: 'anime effect', input: ':one.wiggle:' }
    ]

    it.concurrent.each(testcases)(
      'should have meta with $name',
      ({ input }) => {
        const actual = parseAndExtractFirstMatch(input)
        expect(actual).toBe(input)
      }
    )
  }
})
