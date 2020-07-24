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

export type EmbeddingTypeExtractor = (
  url: Readonly<URL>
) => EmbeddingOrUrl['type']
export type EmbeddingIdExtractor = (
  url: Readonly<URL>,
  ty: EmbeddingOrUrl['type']
) => Embedding['id'] | undefined

const pathNameEmbeddingTypeMap: Map<string, Embedding['type']> = new Map([
  ['files', 'file'],
  ['messages', 'message']
])

export const createTypeExtractor = (
  embeddingOrigin: string
): EmbeddingTypeExtractor => url => {
  if (url.origin !== embeddingOrigin) return 'url'
  const name = url.pathname.split('/')[1] ?? ''
  return pathNameEmbeddingTypeMap.get(name) ?? 'internal'
}

export const createIdExtractor = (
  embeddingOrigin: string
): EmbeddingIdExtractor => (url, ty) => {
  if (url.origin !== embeddingOrigin || ty === 'url' || ty === 'internal')
    return undefined
  const id = url.pathname.split('/')[2] ?? ''
  return uuidRegexp.test(id) ? id : undefined
}

/**
 * パースされたトークンの木構造から再帰的にURLを抽出する
 */
const extractUrlsFromTokens = (tokens: Token[], urls: string[] = []) => {
  let inSpoilerCount = 0

  for (const token of tokens) {
    if (token.children) {
      extractUrlsFromTokens(token.children, urls)
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
export const embeddingExtractor = (
  tokens: Token[],
  typeExtractor: EmbeddingTypeExtractor,
  idExtractor: EmbeddingIdExtractor
): EmbeddingOrUrl[] => {
  const urls = extractUrlsFromTokens(tokens)

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

    const type = typeExtractor(urlObj)
    const id = idExtractor(urlObj, type)

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
 *
 * @param typeIdExtractor マッチ結果から埋め込み/通常URLの種別を返す関数
 * @param idExtractor マッチ結果から埋め込みidを返す関数（通常URL時は`undefined`）
 */
export const embeddingReplacer = (
  rawMessage: string,
  typeExtractor: EmbeddingTypeExtractor,
  idExtractor: EmbeddingIdExtractor
): { text: string; unused: boolean } => {
  return { text: rawMessage, unused: !!(typeExtractor && idExtractor) }
}
