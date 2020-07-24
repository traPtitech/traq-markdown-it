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

interface TokenWithEmbeddingData extends Token {
  embedding?: EmbeddingOrUrl
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

  extractId(
    url: URL,
    type: EmbeddingOrUrl['type']
  ): Embedding['id'] | undefined {
    if (
      url.origin !== this.embeddingOrigin ||
      type === 'url' ||
      type === 'internal'
    )
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
   * 同時にトークンにURLの情報を付与する
   */
  extractUrlsFromTokens(
    tokens: TokenWithEmbeddingData[],
    embeddings: EmbeddingOrUrl[] = []
  ): EmbeddingOrUrl[] {
    let inSpoilerCount = 0

    for (const token of tokens) {
      if (token.children) {
        this.extractUrlsFromTokens(token.children, embeddings)
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
          const embedding = this.urlToEmbeddingData(url)
          if (embedding) {
            token.embedding = embedding
            embeddings.push(embedding)
          }
        }
      }

      // ``の内部はtoken.type === 'code_inline'
      // ```の内部はtoken.type === 'fence'
    }
    return embeddings
  }

  /**
   * markdownからURL・埋め込みURLを抽出する
   *
   * @param typeIdExtractor マッチ結果から埋め込み/通常URLの種別を返す関数
   * @param idExtractor マッチ結果から埋め込みidを返す関数（通常URL時は`undefined`）
   */
  extract(tokens: Token[]): EmbeddingOrUrl[] {
    const embeddings = this.extractUrlsFromTokens(tokens)
    const knownIdSet: Set<string> = new Set()

    const filteredEmbeddings: EmbeddingOrUrl[] = []
    for (const embedding of embeddings) {
      if (embedding.type === 'internal') continue
      if (embedding.type === 'url') {
        filteredEmbeddings.push(embedding)
        continue
      }

      if (!knownIdSet.has(embedding.id)) {
        knownIdSet.add(embedding.id)
        filteredEmbeddings.push(embedding)
      }
    }
    return filteredEmbeddings
  }

  /**
   * markdownから埋め込みURLを抽出してすべて置換する
   */
  replace(rawMessage: string): { text: string } {
    return { text: rawMessage }
  }
}
