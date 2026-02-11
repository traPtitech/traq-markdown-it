import stampPlugin, {
  hexReg,
  hslReg,
  renderHexStamp,
  renderHslStamp,
  renderNormalStamp,
  renderUserStamp
} from '#/stamp'
import { setup } from './setupMd'

const setupWithStamp = () => {
  const { md, store } = setup()

  stampPlugin(md.md, store)
  return { md, store }
}

describe('stamp', () => {
  const { md: traQMd } = setupWithStamp()
  const md = traQMd.md

  {
    const expected1 =
      '<i class="emoji message-emoji " title=":one:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:one:</i>'
    const expected2 =
      '<i class="emoji message-emoji " title=":two:" style="background-image: url(/api/v3/files/d7461966-e5d3-4c6d-9538-7c8605f45a1e);">:two:</i>'

    it.concurrent('can render normal stamp (1)', () => {
      const actual = renderNormalStamp('one', ':one:', [])
      expect(actual).toBe(expected1)
    })
    it.concurrent('can render normal stamp (2)', () => {
      const actual = renderNormalStamp('two', ':two:', [])
      expect(actual).toBe(expected2)
    })
    it.concurrent('can render normal stamps', () => {
      const actual = md.render(':one: :two:').trim()
      const expected = `<p>${expected1} ${expected2}</p>`
      expect(actual).toBe(expected)
    })
  }

  {
    const expected1 =
      '<i class="emoji message-emoji " title=":@one:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:@one:</i>'
    const expected2 =
      '<i class="emoji message-emoji " title=":@longlonglonglonglonglonglonglonglonglonglonglong:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:@longlonglonglonglonglonglonglonglonglonglonglong:</i>'
    const expected3 =
      '<i class="emoji message-emoji " title=":@Webhook#random-Va1ue:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:@Webhook#random-Va1ue:</i>'
    const expected4 = ':@invalid:'

    it.concurrent('can render user stamp', () => {
      const actual = renderUserStamp('@one', ':@one:', [])
      expect(actual).toBe(expected1)
    })
    it.concurrent('can render long user stamp', () => {
      const actual = renderUserStamp(
        '@longlonglonglonglonglonglonglonglonglonglonglong',
        ':@longlonglonglonglonglonglonglonglonglonglonglong:',
        []
      )
      expect(actual).toBe(expected2)
    })
    it.concurrent('can render webhook user stamp', () => {
      const actual = renderUserStamp(
        '@Webhook#random-Va1ue',
        ':@Webhook#random-Va1ue:',
        []
      )
      expect(actual).toBe(expected3)
    })
    it.concurrent('can render user stamps', () => {
      const actual = md
        .render(
          ':@one: :@longlonglonglonglonglonglonglonglonglonglonglong: :@Webhook#random-Va1ue:'
        )
        .trim()
      const expected = `<p>${expected1} ${expected2} ${expected3}</p>`
      expect(actual).toBe(expected)
    })
    it.concurrent('wont render invalid user stamp', () => {
      const actual = md.render(':@invalid:').trim()
      const expected = `<p>${expected4}</p>`
      expect(actual).toBe(expected)
    })
  }

  {
    const expected1 =
      '<i class="emoji message-emoji " title=":0xffffff:" style="background-color: #ffffff;">:0xffffff:</i>'
    const expected2 =
      '<i class="emoji message-emoji " title=":0xFFFFFF:" style="background-color: #FFFFFF;">:0xFFFFFF:</i>'
    const expected3 =
      '<i class="emoji message-emoji " title=":0xFFeeFF:" style="background-color: #FFeeFF;">:0xFFeeFF:</i>'

    it.concurrent('can render hex color stamp (1)', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const actual = renderHexStamp(hexReg.exec('0xffffff')!)
      expect(actual).toBe(expected1)
    })
    it.concurrent('can render hex color stamp (2)', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const actual = renderHexStamp(hexReg.exec('0xFFFFFF')!)
      expect(actual).toBe(expected2)
    })
    it.concurrent('can render hex color stamp (3)', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const actual = renderHexStamp(hexReg.exec('0xFFeeFF')!)
      expect(actual).toBe(expected3)
    })
    it.concurrent('can render hex color stamps', () => {
      const actual = md.render(':0xffffff: :0xFFFFFF: :0xFFeeFF:').trim()
      const expected = `<p>${expected1} ${expected2} ${expected3}</p>`
      expect(actual).toBe(expected)
    })
  }

  {
    const expected1 =
      '<i class="emoji message-emoji " title=":hsl(0, 0%, 0%):" style="background-color: hsl(0, 0%, 0%);">:hsl(0, 0%, 0%):</i>'
    const expected2 = ':invalid(invalidinvalid):'
    const expected3 = ':invalidinvalidinvalidinvalidinvalid(invalidinvalid):'

    it.concurrent('can render hsl color stamp', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const actual = renderHslStamp(hslReg.exec('hsl(0, 0%, 0%)')!)
      expect(actual).toBe(expected1)
    })
    it.concurrent('can render hsl color stamps', () => {
      const actual = md.render(':hsl(0, 0%, 0%):').trim()
      const expected = `<p>${expected1}</p>`
      expect(actual).toBe(expected)
    })
    it.concurrent('wont render invalid stamp (1)', () => {
      const actual = md.render(':invalid(invalidinvalid):').trim()
      const expected = `<p>${expected2}</p>`
      expect(actual).toBe(expected)
    })
    it.concurrent('wont render invalid stamp (2)', () => {
      const actual = md
        .render(':invalidinvalidinvalidinvalidinvalid(invalidinvalid):')
        .trim()
      const expected = `<p>${expected3}</p>`
      expect(actual).toBe(expected)
    })
  }

  {
    const expected1 =
      '<i class="emoji message-emoji ex-large" title=":one:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:one:</i>'
    const expected2 =
      '<span class="emoji-effect wiggle"><i class="emoji message-emoji " title=":one:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:one:</i></span>'
    const expected3 = ':one.invalid:'
    const expected4 = ':one.wiggle.wiggle.wiggle.wiggle.wiggle.wiggle:'

    it.concurrent('can render stamp with size effect', () => {
      const actual = renderNormalStamp('one', ':one:', ['ex-large'])
      expect(actual).toBe(expected1)
    })
    it.concurrent('can render stamp with anime effect', () => {
      const actual = renderNormalStamp('one', ':one:', ['wiggle'])
      expect(actual).toBe(expected2)
    })
    it.concurrent('can render stamps with effect', () => {
      const actual = md.render(':one.ex-large: :one.wiggle:').trim()
      const expected = `<p>${expected1} ${expected2}</p>`
      expect(actual).toBe(expected)
    })
    it.concurrent('wont render stamp with unknown effect', () => {
      const actual = md.render(':one.invalid:').trim()
      const expected = `<p>${expected3}</p>`
      expect(actual).toBe(expected)
    })
    it.concurrent('wont render stamp with many animation effect', () => {
      const actual = md
        .render(':one.wiggle.wiggle.wiggle.wiggle.wiggle.wiggle:')
        .trim()
      const expected = `<p>${expected4}</p>`
      expect(actual).toBe(expected)
    })
  }

  {
    const parseAndExtractFirstMatch = (input: string) =>
      md.parse(input, {})[1]?.children?.[0]?.meta.match[0]

    it.concurrent('should have meta with no effect', () => {
      const actual = parseAndExtractFirstMatch(':one:')
      const expected = ':one:'
      expect(actual).toBe(expected)
    })

    it.concurrent('should have meta with size effect', () => {
      const actual = parseAndExtractFirstMatch(':one.large:')
      const expected = ':one.large:'
      expect(actual).toBe(expected)
    })

    it.concurrent('should have meta with anime effect', () => {
      const actual = parseAndExtractFirstMatch(':one.wiggle:')
      const expected = ':one.wiggle:'
      expect(actual).toBe(expected)
    })
  }

  {
    it.concurrent('should use generateStampHref if exists', () => {
      const { store } = setupWithStamp()
      store.generateStampHref = (fileId: string) =>
        `https://example.com/${fileId}`

      const actual = md.render(':one:').trim()
      const expected = `<p><i class="emoji message-emoji " title=":one:" style="background-image: url(https://example.com/e97518db-ebb8-450f-9b4a-273234e68491);">:one:</i></p>`
      expect(actual).toBe(expected)
    })
  }
})
