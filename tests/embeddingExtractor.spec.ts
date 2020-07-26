import EmbeddingExtractor, { EmbeddingOrUrl } from '#/embeddingExtractor'
import { setup } from './setupMd'
import Token from 'markdown-it/lib/token'

const basePath = `https://example.com`
const nonBasePath = `https://yet.another.example.com`

const id1 = 'e97518db-ebb8-450f-9b4a-273234e68491'
const id2 = 'd7461966-e5d3-4c6d-9538-7c8605f45a1e'
const path1 = `${basePath}/files/${id1}`
const path2 = `${basePath}/files/${id2}`
const externalUrl = `${nonBasePath}/files/${id1}`
const internalUrl = `${basePath}/somewhere`

describe('embeddingExtractor', () => {
  const md = setup()
  const embeddingExtractor = new EmbeddingExtractor(basePath)

  const parse = (message: string) => md.md.parse(message, {})
  const extract = (tokens: Token[]): EmbeddingOrUrl[] =>
    embeddingExtractor.extract(tokens)
  const render = (tokens: Token[]): string => {
    embeddingExtractor.removeTailEmbeddings(tokens)
    return md._render(tokens).trim()
  }

  it('can catch mail protocol', () => {
    const actual = embeddingExtractor.urlToEmbeddingData(
      'mailto:user@example.com'
    )
    expect(actual).toBeUndefined()
  })

  it('can catch invalid url', () => {
    const actual = embeddingExtractor.urlToEmbeddingData('https//invalid')
    expect(actual).toBeUndefined()
  })

  it('can extract a file from url', () => {
    const tokens = parse(path1)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'file',
        id: id1
      }
    ])
    expect(rendered).toEqual(`<p></p>`)
  })

  it('can extract a file from link url []()', () => {
    const tokens = parse(`[link](${path1}) [${path2}](invalid)`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'file',
        id: id1
      }
    ])
    expect(rendered).toEqual(
      `<p><a href="https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">link</a> <a href="invalid" target="_blank" rel="nofollow noopener noreferrer">https://example.com/files/d7461966-e5d3-4c6d-9538-7c8605f45a1e</a></p>`
    )
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
    expect(rendered).toEqual(`<p></p>`)
  })

  it('can ignore a file inside spoiler or code block from url', () => {
    const tokens = parse(`!!${path1}!! \`${path1}\` \`\`\`${path1}\`\`\``)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([])
    expect(rendered).toEqual(
      `<p><span class="spoiler"><a href="https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</a></span> <code>https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</code> <code>https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</code></p>`
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
      `<p>file <a href="https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</a> is file</p>`
    )
  })

  it('can extract files from text with url in middle of it', () => {
    const tokens = parse(`file ${path1} and ${path2} are file`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'file',
        id: id1
      },
      {
        type: 'file',
        id: id2
      }
    ])
    expect(rendered).toEqual(
      `<p>file <a href="https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</a> and <a href="https://example.com/files/d7461966-e5d3-4c6d-9538-7c8605f45a1e" target="_blank" rel="nofollow noopener noreferrer">https://example.com/files/d7461966-e5d3-4c6d-9538-7c8605f45a1e</a> are file</p>`
    )
  })

  it('can extract a file from text with url at the end of it', () => {
    const noAttachMessage = 'attach!\n'
    const tokens = parse(`${noAttachMessage}${path1}`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'file',
        id: id1
      }
    ])
    expect(rendered).toEqual(`<p>attach!</p>`)
  })

  it('can extract normal url and do not remove that from message', () => {
    const tokens = parse(`won't be removed: ${externalUrl}`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'url',
        url: externalUrl
      }
    ])
    expect(rendered).toEqual(
      `<p>won't be removed: <a href="https://yet.another.example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">https://yet.another.example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</a></p>`
    )
  })

  it('does not extract internal url', () => {
    const tokens = parse(`${internalUrl}`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([])
    expect(rendered).toEqual(
      `<p><a href="https://example.com/somewhere" target="_blank" rel="nofollow noopener noreferrer">https://example.com/somewhere</a></p>`
    )
  })

  it('does not remove embedding url before url', () => {
    const tokens = parse(`${path1} ${externalUrl}`)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual([
      {
        type: 'file',
        id: id1
      },
      {
        type: 'url',
        url: externalUrl
      }
    ])
    expect(rendered).toEqual(
      `<p><a href="https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">https://example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</a> <a href="https://yet.another.example.com/files/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">https://yet.another.example.com/files/e97518db-ebb8-450f-9b4a-273234e68491</a></p>`
    )
  })
})
