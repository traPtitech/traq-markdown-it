import EmbeddingExtractor, {
  EmbeddingOrUrl
} from '#/embeddingExtractor'
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
  const md = setup().md
  const embeddingExtractor = new EmbeddingExtractor(basePath)

  const parse = (message: string) => md.parse(message, {})
  const extract = (message: Token[]): EmbeddingOrUrl[] =>
    embeddingExtractor.extract(message)

  it('can extract a file from url', () => {
    const message = parse(path1)
    const result = extract(message)
    expect(result).toEqual([
        {
          type: 'file',
          id: id1
        }
      ]
    )
  })

  it('can extract a file from text with url in middle of it', () => {
    const message = parse(`file ${path1} is file`)
    const result = extract(message)
    expect(result).toEqual([
        {
          type: 'file',
          id: id1
        }
      ]
    )
  })

  it('can extract files from text with url in middle of it', () => {
    const message = parse(`file ${path1} and ${path2} are file`)
    const result = extract(message)
    expect(result).toEqual([
        {
          type: 'file',
          id: id1
        },
        {
          type: 'file',
          id: id2
        }
      ])
  })

  it('can extract a file from text with url at the end of it', () => {
    const noAttachMessage = 'attach!\n'
    const message = parse(`${noAttachMessage}${path1}`)
    const result = extract(message)
    expect(result).toEqual([
        {
          type: 'file',
          id: id1
        }
      ])
  })

  it('can extract normal url and do not remove that from message', () => {
    const message = parse(`won't be removed: ${externalUrl}`)
    const result = extract(message)
    expect(result).toEqual([{
          type: 'url',
          url: externalUrl,
        }
      ])
  })

  it('does not extract internal url', () => {
    const message = parse(`${internalUrl}`)
    const result = extract(message)
    expect(result).toEqual([])
  })

  it('does not remove embedding url before url', () => {
    const message = parse(`${path1} ${externalUrl}`)
    const result = extract(message)
    expect(result).toEqual( [
        {
          type: 'file',
          id: id1
        },
        {
          type: 'url',
          url: externalUrl,
        }
      ]
    )
  })
})
