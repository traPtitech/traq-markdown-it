import {
  embeddingReplacer,
  EmbeddingsExtractedMessage,
  createTypeExtractor,
  createIdExtractor
} from '#/embeddingExtractor'
import LinkifyIt from "linkify-it"

const basePath = `https://example.com`
const nonBasePath = `https://yet.another.example.com`
const linkify = new LinkifyIt()

const extractor = (message: string): EmbeddingsExtractedMessage =>
  embeddingReplacer(message, linkify, createTypeExtractor(basePath), createIdExtractor(basePath))

const id1 = 'e97518db-ebb8-450f-9b4a-273234e68491'
const id2 = 'd7461966-e5d3-4c6d-9538-7c8605f45a1e'
const path1 = `${basePath}/files/${id1}`
const path2 = `${basePath}/messages/${id2}`
const externalUrl = `${nonBasePath}/files/${id1}`
const internalUrl = `${basePath}/somewhere`

describe('embeddingReplacer', () => {
  it('can extract a file from url', () => {
    const message = `${path1}`
    const result = extractor(message)
    expect(result).toEqual({
      rawText: message,
      text: '',
      embeddings: [
        {
          type: 'file',
          id: id1,
          startIndex: 0,
          endIndex: path1.length
        }
      ]
    })
  })

  it('can extract a file from text with url in middle of it', () => {
    const message = `file ${path1} is file`
    const replacedMessage = `file [[添付ファイル]] is file`
    const result = extractor(message)
    expect(result).toEqual({
      rawText: message,
      text: replacedMessage,
      embeddings: [
        {
          type: 'file',
          id: id1,
          startIndex: 5,
          endIndex: 5 + path1.length
        }
      ]
    })
  })

  it('can extract files from text with url in middle of it', () => {
    const message = `file ${path1} and ${path2} are file and message`
    const replacedMessage = `file [[添付ファイル]] and [[添付メッセージ]] are file and message`
    const result = extractor(message)
    expect(result).toEqual({
      rawText: message,
      text: replacedMessage,
      embeddings: [
        {
          type: 'file',
          id: id1,
          startIndex: 5,
          endIndex: 5 + path1.length
        },
        {
          type: 'message',
          id: id2,
          startIndex: 5 + path1.length + 5,
          endIndex: 5 + path1.length + 5 + path2.length
        }
      ]
    })
  })

  it('can extract a file from text with url at the end of it', () => {
    const noAttachMessage = 'attach!\n'
    const message = `${noAttachMessage}${path1}`
    const result = extractor(message)
    expect(result).toEqual({
      rawText: message,
      text: noAttachMessage,
      embeddings: [
        {
          type: 'file',
          id: id1,
          startIndex: noAttachMessage.length,
          endIndex: noAttachMessage.length + path1.length
        }
      ]
    })
  })

  it('does not replace internal url in the middle', () => {
    const message = `${externalUrl}, hello`
    const result = extractor(message)
    expect(result).toEqual({
      rawText: message,
      text: message,
      embeddings: [
        {
          type: 'url',
          url: externalUrl,
          startIndex: 0,
          endIndex: externalUrl.length
        }
      ]
    })
  })

  it('does not replace/include internal url', () => {
    const message = `${internalUrl}`
    const result = extractor(message)
    expect(result).toEqual({
      rawText: message,
      text: message,
      embeddings: []
    })
  })
})
