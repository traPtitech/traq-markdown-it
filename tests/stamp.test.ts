import stampPlugin, { renderNormalStamp, renderUserStamp, renderHexStamp, hexReg, renderHslStamp, hslReg } from '#/stamp'
import MarkdownIt from 'markdown-it'
import { Store } from '#/Store'

const setup = () => {
  const md = new MarkdownIt()

  const nameIdTable: Record<string, string> = {
    one:'e97518db-ebb8-450f-9b4a-273234e68491',
    two: 'd7461966-e5d3-4c6d-9538-7c8605f45a1e',
    longlonglonglonglonglonglonglonglonglonglonglong:'e97518db-ebb8-450f-9b4a-273234e68491',
    'Webhook#random-Va1ue':'e97518db-ebb8-450f-9b4a-273234e68491'
  }

  const store: Pick<Store, 'getUserByName' | 'getStampByName'> = {
    getUserByName: name => nameIdTable[name] ? ({ iconFileId: nameIdTable[name] }) : undefined,
    getStampByName: name => nameIdTable[name] ? ({ name, fileId: nameIdTable[name] }) : undefined
  }

  stampPlugin(md, store)
}

describe('stamp', () => {
  setup()

  it('can render normal stamp (1)', () => {
    const actual = renderNormalStamp('one', ':one:', [])
    const expected = '<i class="emoji message-emoji " title=":one:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:one:</i>'
    expect(actual).toBe(expected)
  })
  it('can render normal stamp (2)', () => {
    const actual = renderNormalStamp('two', ':two:', [])
    const expected = '<i class="emoji message-emoji " title=":two:" style="background-image: url(/api/v3/files/d7461966-e5d3-4c6d-9538-7c8605f45a1e);">:two:</i>'
    expect(actual).toBe(expected)
  })
  it('can render user stamp', () => {
    const actual = renderUserStamp('@one', ':@one:', [])
    const expected = '<i class="emoji message-emoji " title=":@one:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:@one:</i>'
    expect(actual).toBe(expected)
  })
  it('can render long user stamp', () => {
    const actual = renderUserStamp('@longlonglonglonglonglonglonglonglonglonglonglong', ':@longlonglonglonglonglonglonglonglonglonglonglong:', [])
    const expected = '<i class="emoji message-emoji " title=":@longlonglonglonglonglonglonglonglonglonglonglong:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:@longlonglonglonglonglonglonglonglonglonglonglong:</i>'
    expect(actual).toBe(expected)
  })
  it('can render webhook user stamp', () => {
    const actual = renderUserStamp('@Webhook#random-Va1ue', ':@Webhook#random-Va1ue:', [])
    const expected = '<i class="emoji message-emoji " title=":@Webhook#random-Va1ue:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:@Webhook#random-Va1ue:</i>'
    expect(actual).toBe(expected)
  })
  it('can render hex color stamp', () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const actual = renderHexStamp(hexReg.exec('0xffffff')!)
    const expected = '<i class="emoji message-emoji " title=":0xffffff:" style="background-color: #ffffff;">:0xffffff:</i>'
    expect(actual).toBe(expected)
  })
  it('can render hsl color stamp', () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const actual = renderHslStamp(hslReg.exec('hsl(0, 0%, 0%)')!)
    const expected = '<i class="emoji message-emoji " title=":hsl(0, 0%, 0%):" style="background-color: hsl(0, 0%, 0%);">:hsl(0, 0%, 0%):</i>'
    expect(actual).toBe(expected)
  })
  it('can render stamp with size effect', () => {
    const actual = renderNormalStamp('one', ':one:', ['ex-large'])
    const expected = '<i class="emoji message-emoji ex-large" title=":one:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:one:</i>'
    expect(actual).toBe(expected)
  })
  it('can render stamp with anime effect', () => {
    const actual = renderNormalStamp('one', ':one:', ['wiggle'])
    const expected = '<span class="emoji-effect wiggle"><i class="emoji message-emoji " title=":one:" style="background-image: url(/api/v3/files/e97518db-ebb8-450f-9b4a-273234e68491);">:one:</i></span>'
    expect(actual).toBe(expected)
  })
})
