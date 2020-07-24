/* eslint-disable @typescript-eslint/no-unused-vars */
import Token from 'markdown-it/lib/token'

const uuidRegexp = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/

export type Embedding = EmbeddingFile | EmbeddingMessage
export type EmbeddingOrUrl = InternalUrl | ExternalUrl | Embedding

type EmbeddingBase = {
  type: EmbeddingType
  id: string
}

export type InternalUrl = {
  type: 'internal'
}
export type ExternalUrl = {
  type: 'url'
  url: string
}

type EmbeddingType = 'file' | 'message'

export type EmbeddingFile = EmbeddingBase & {
  type: 'file'
}
export type EmbeddingMessage = EmbeddingBase & {
  type: 'message'
}

export default class EmbeddingExtractor {
  readonly pathNameEmbeddingTypeMap = new Map<string, Embedding['type']>([
    ['files', 'file'],
    ['messages', 'message']
  ])
  readonly embeddingOrigin: string

  constructor(embeddingOrigin: string) {
    this.embeddingOrigin = embeddingOrigin
  }

  extractType(url: URL): EmbeddingOrUrl['type'] {
    if (url.origin !== this.embeddingOrigin) return 'url'
    const name = url.pathname.split('/')[1] ?? ''
    return this.pathNameEmbeddingTypeMap.get(name) ?? 'internal'
  }

  extractId(url: URL, type: EmbeddingOrUrl['type']): Embedding['id'] | undefined{
    if (url.origin !== this.embeddingOrigin || type === 'url' || type === 'internal')
      return undefined
    const id = url.pathname.split('/')[2] ?? ''
    return uuidRegexp.test(id) ? id : undefined
  }

  urlToEmbeddingData(url: string): EmbeddingOrUrl | undefined {
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      return // 不正なURLだったので無視
    }

    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return
    }

    const type = this.extractType(urlObj)
    const id = this.extractId(urlObj, type)

    if (type === 'internal') {
      return
    } else if (type === 'url') {
      return { type, url }
    } else if (id) {
      return { type, id }
    }
    return
  }

  /**
   * パースされたトークンの木構造から再帰的にURLを抽出する
   */
  extractUrlsFromTokens(tokens: Token[], urls: string[] = []): string[] {
    let inSpoilerCount = 0

    for (const token of tokens) {
      if (token.children) {
        this.extractUrlsFromTokens(token.children, urls)
        continue
      }

      if (token.type === 'spoiler_open') {
        inSpoilerCount++
        continue
      }
      if (token.type === 'spoiler_close' && inSpoilerCount > 0) {
        inSpoilerCount--
        continue
      }

      // spoiler内部は無視
      if (inSpoilerCount > 0) continue

      // token.markupを利用して[]()の形式のリンクは無視
      if (token.type === 'link_open' && token.markup === 'linkify') {
        const url = token.attrGet('href')
        if (url) {
          urls.push(url)
        }
      }

      // ``の内部はtoken.type === 'code_inline'
      // ```の内部はtoken.type === 'fence'
    }
    return urls
  }

  /**
   * markdownからURL・埋め込みURLを抽出する
   *
   * @param typeIdExtractor マッチ結果から埋め込み/通常URLの種別を返す関数
   * @param idExtractor マッチ結果から埋め込みidを返す関数（通常URL時は`undefined`）
   */
  extract(
    tokens: Token[]
  ): EmbeddingOrUrl[] {
    const urls = this.extractUrlsFromTokens(tokens)

    const embeddings: EmbeddingOrUrl[] = []
    const knownIdSet: Set<string> = new Set()

    for (const url of urls) {
      let urlObj: URL
      try {
        urlObj = new URL(url)
      } catch {
        continue // 不正なURLだったので無視
      }

      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        continue
      }

      const type = this.extractType(urlObj)
      const id = this.extractId(urlObj, type)

      if (type === 'internal') {
        continue
      } else if (type === 'url') {
        embeddings.push({ type: 'url', url: url })
      } else if (id && !knownIdSet.has(id)) {
        embeddings.push({ type, id })
        knownIdSet.add(id)
      }
    }

    return embeddings
  }

  /**
   * markdownから埋め込みURLを抽出してすべて置換する
   */
  replace (
    rawMessage: string
  ): { text: string } {
    return { text: rawMessage }
  }
}
