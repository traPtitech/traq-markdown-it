import EmbeddingExtractor, { EmbeddingOrUrl } from '#/embeddingExtractor'
import { setup } from './setupMd'
import type Token from 'markdown-it/lib/token'

const basePath = 'https://example.com'
const nonBasePath = 'https://yet.another.example.com'

const id1 = 'e97518db-ebb8-450f-9b4a-273234e68491'
const id2 = 'd7461966-e5d3-4c6d-9538-7c8605f45a1e'
const path1 = `${basePath}/files/${id1}`
const path2 = `${basePath}/files/${id2}`
const nonUUidPath = `${basePath}/files/${id1}-`
const externalUrl = `${nonBasePath}/files/${id1}`
const internalUrl = `${basePath}/somewhere`

describe('embeddingExtractor', () => {
  const { md } = setup()
  const embeddingExtractor = new EmbeddingExtractor(basePath)

  const parse = (message: string) => md.md.parse(message, {})
  const extract = (tokens: Token[]): EmbeddingOrUrl[] =>
    embeddingExtractor.extract(tokens)
  const render = (tokens: Token[]): string => {
    embeddingExtractor.removeTailEmbeddings(tokens)
    return md._render(tokens).trim()
  }

  const urlToEmbeddingDataTestcases = [
    {
      name: 'can catch mail protocol',
      input: 'mailto:user@example.com',
      expected: undefined
    },
    {
      name: 'can catch invalid url',
      input: 'https//invalid',
      expected: undefined
    },
    {
      name: 'can catch invalid file url',
      input: 'https://example.com/files/',
      expected: undefined
    }
  ]

  it.concurrent.each(urlToEmbeddingDataTestcases)(
    '$name',
    ({ input, expected }) => {
      const actual = embeddingExtractor.urlToEmbeddingData(input)
      expect(actual).toBe(expected)
    }
  )

  const extractedAndRenderTestcases = [
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
      name: 'can extract a file from link url []()',
      input: `[link](${path1}) [${path2}](invalid)`,
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
      input: `file ${path1} and ${path2} are file`,
      expectedExtracted: [
        {
          type: 'file',
          id: id1
        },
        {
          type: 'file',
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
      name: 'can extract normal url and do not remove that from message',
      input: `won't be removed: ${externalUrl}`,
      expectedExtracted: [
        {
          type: 'url',
          url: externalUrl
        }
      ]
    },
    {
      name: 'does not extract internal url',
      input: internalUrl,
      expectedExtracted: []
    },
    {
      name: 'does not extract an invalid url',
      input: nonUUidPath,
      expectedExtracted: []
    },
    {
      name: 'does not remove embedding url before url',
      input: `${path1} ${externalUrl}`,
      expectedExtracted: [
        {
          type: 'file',
          id: id1
        },
        {
          type: 'url',
          url: externalUrl
        }
      ]
    }
  ]

  it.concurrent.each(extractedAndRenderTestcases)(
    '$name',
    ({ input, expectedExtracted }) => {
      const tokens = parse(input)
      const extracted = extract(tokens)
      const rendered = render(tokens)
      expect(extracted).toEqual(expectedExtracted)
      expect(rendered).toMatchSnapshot()
    }
  )
})
