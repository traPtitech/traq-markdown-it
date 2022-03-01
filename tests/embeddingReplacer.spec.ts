import EmbeddingExtractor, { EmbeddingOrUrl } from '#/embeddingExtractor'
import { setup } from './setupMd'
import type Token from 'markdown-it/lib/token'

const basePath = 'https://example.com'
const nonBasePath = 'https://yet.another.example.com'

const id1 = 'e97518db-ebb8-450f-9b4a-273234e68491'
const id2 = 'd7461966-e5d3-4c6d-9538-7c8605f45a1e'
const path1 = `${basePath}/files/${id1}`
const path2 = `${basePath}/messages/${id2}`
const externalUrl = `${nonBasePath}/files/${id1}`
const internalUrl = `${basePath}/somewhere`

describe('embeddingReplacer', () => {
  const { md } = setup()
  const embeddingExtractor = new EmbeddingExtractor(basePath)

  const parse = (message: string) => md.md.parseInline(message, {})
  const extract = (tokens: Token[]): EmbeddingOrUrl[] =>
    embeddingExtractor.extract(tokens)
  const render = (tokens: Token[]): string => {
    embeddingExtractor.removeTailEmbeddingsFromTailParagraph(
      tokens[0]?.children ?? []
    )
    embeddingExtractor.replace(tokens)
    return md._render(tokens).trim()
  }

  const testcases = [
    {
      name: 'can extract a file from url',
      input: path1,
      expectedExtracted: [
        {
          type: 'file',
          id: id1
        }
      ]
    },
    {
      name: 'can extract a file from url and remove tail spaces',
      input: `${path1}\n\n    \n`,
      expectedExtracted: [
        {
          type: 'file',
          id: id1
        }
      ]
    },
    {
      name: 'can ignore a file inside spoiler or code block from url',
      input: `!!${path1}!! \`${path1}\` \`\`\`${path1}\`\`\``,
      expectedExtracted: []
    },
    {
      name: 'can extract a file from text with url in middle of it',
      input: `file ${path1} is file`,
      expectedExtracted: [
        {
          type: 'file',
          id: id1
        }
      ]
    },
    {
      name: 'can extract files from text with url in middle of it',
      input: `file ${path1} and ${path2} are file and message`,
      expectedExtracted: [
        {
          type: 'file',
          id: id1
        },
        {
          type: 'message',
          id: id2
        }
      ]
    },
    {
      name: 'can extract a file from text with url at the end of it',
      input: `attach!\n${path1}`,
      expectedExtracted: [
        {
          type: 'file',
          id: id1
        }
      ]
    },
    {
      name: 'does not replace internal url in the middle',
      input: `${externalUrl}, hello`,
      expectedExtracted: [
        {
          type: 'url',
          url: externalUrl
        }
      ]
    },
    {
      name: 'does not replace/include internal url',
      input: internalUrl,
      expectedExtracted: []
    }
  ]

  it.concurrent.each(testcases)('$name', ({ input, expectedExtracted }) => {
    const tokens = parse(input)
    const extracted = extract(tokens)
    const rendered = render(tokens)
    expect(extracted).toEqual(expectedExtracted)
    expect(rendered).toMatchSnapshot()
  })
})
