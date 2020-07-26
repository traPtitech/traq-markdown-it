import EmbeddingExtractor, { EmbeddingOrUrl } from '#/embeddingExtractor'
import { setup } from './setupMd'
import Token from 'markdown-it/lib/token'

const basePath = `https://example.com`
const nonBasePath = `https://yet.another.example.com`

const id1 = 'e97518db-ebb8-450f-9b4a-273234e68491'
const id2 = 'd7461966-e5d3-4c6d-9538-7c8605f45a1e'
const path1 = `${basePath}/files/${id1}`
const path2 = `${basePath}/messages/${id2}`
const externalUrl = `${nonBasePath}/files/${id1}`
const internalUrl = `${basePath}/somewhere`

describe('embeddingReplacer', () => {
  const md = setup()
  const embeddingExtractor = new EmbeddingExtractor(basePath)

  const parse = (message: string) => md.md.parseInline(message, {})
  const extract = (tokens: Token[]): EmbeddingOrUrl[] =>
    embeddingExtractor.extract(tokens)
  const render = (tokens: Token[]): string => {
    embeddingExtractor.removeTailEmbeddingsFromTailParagraph(
      tokens[0].children || []
    )
    embeddingExtractor.replace(tokens)
    return md._render(tokens).trim()
  }

  it('can extract a file from url', () => {
    const tokens = parse(`${path1}`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'file',
        id: id1
      }
    ])
    expect(rendered).toEqual('')
  })

  it('can extract a file from url and remove tail spaces', () => {
    const tokens = parse(`${path1}\n\n    \n`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'file',
        id: id1
      }
    ])
    expect(rendered).toEqual('')
  })

  it('can ignore a file inside spoiler or code block from url', () => {
    const tokens = parse(`!!${path1}!! \`${path1}\` \`\`\`${path1}\`\`\``)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([])
    expect(rendered).toEqual(
      `<span class="spoiler"><a href="https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</a></span> <code>https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</code> <code>https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</code>`
    )
  })

  it('can extract a file from text with url in middle of it', () => {
    const tokens = parse(`file ${path1} is file`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'file',
        id: id1
      }
    ])
    expect(rendered).toEqual(
      `file <a href="https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">[[添付ファイル]]</a> is file`
    )
  })

  it('can extract files from text with url in middle of it', () => {
    const tokens = parse(`file ${path1} and ${path2} are file and message`)
    const result = extract(tokens)
    const rendered = render(tokens)
    expect(result).toEqual([
      {
        type: 'file',
        id: id1
      },
      {
        type: 'message',
        id: id2
      }
    ])
    expect(rendered).toEqual(
      `file <a href="https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">[[添付ファイル]]</a> and <a href="https://example.com/messages/d7461966-e5d3-4c6d-9538-7c8605f45a1e" target="_blank" rel="nofollow noopener noreferrer">[[引用メッセージ]]</a> are file and message`
    )
  })

  it('can extract a file from text with url at the end of it', () => {
    const noAttachMessage = 'attach!\n'
    const tokens = parse(`${noAttachMessage}${path1}`)
    const result = extract(tokens)
    const rendered = render(tokens)
    expect(result).toEqual([
      {
        type: 'file',
        id: id1
      }
    ])
    expect(rendered).toEqual(`attach!`)
  })

  it('does not replace internal url in the middle', () => {
    const tokens = parse(`${externalUrl}, hello`)
    const result = extract(tokens)
    const rendered = render(tokens)
    expect(result).toEqual([
      {
        type: 'url',
        url: externalUrl
      }
    ])
    expect(rendered).toEqual(
      `<a href="https://yet.another.example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">https://yet.another.example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</a>, hello`
    )
  })

  it('does not replace/include internal url', () => {
    const tokens = parse(`${internalUrl}`)
    const result = extract(tokens)
    const rendered = render(tokens)
    expect(result).toEqual([])
    expect(rendered).toEqual(
      `<a href="https://example.com/somewhere" target="_blank" rel="nofollow noopener noreferrer">https://example.com/somewhere</a>`
    )
  })
})
