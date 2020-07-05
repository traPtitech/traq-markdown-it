import { LinkifyIt } from 'linkify-it'

const spaceRegexp = /^\s*$/
const uuidRegexp = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/

export type Embedding = EmbeddingFile | EmbeddingMessage
export type EmbeddingOrUrl = NormalUrl | InternalUrl | Embedding

type MessageFragment = {
  startIndex: number
  endIndex: number
}
type EmbeddingBase = MessageFragment & {
  type: EmbeddingType
  id: string
}

export type NormalUrl = MessageFragment & {
  type: 'url'
  url: string
}
export type InternalUrl = {
  type: 'internal'
  url: string
}

type EmbeddingType = 'file' | 'message'

export type EmbeddingFile = EmbeddingBase & {
  type: 'file'
}
export type EmbeddingMessage = EmbeddingBase & {
  type: 'message'
}

export type EmbeddingsExtractedMessage = {
  rawText: string
  text: string
  embeddings: EmbeddingOrUrl[]
}

export type EmbeddingTypeExtractor = (url: URL) => EmbeddingOrUrl['type']
export type EmbeddingIdExtractor = (
  url: URL,
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

const checkBlank = (
  rawMessage: string,
  prevEndIndex: number,
  startIndex: number
) => {
  const substrFromPrev = rawMessage.substring(prevEndIndex, startIndex)
  return spaceRegexp.test(substrFromPrev)
}

/**
 * markdownからURL・埋め込みURLを抽出する
 *
 * @param typeIdExtractor マッチ結果から埋め込み/通常URLの種別を返す関数
 * @param idExtractor マッチ結果から埋め込みidを返す関数（通常URL時は`undefined`）
 */
export const embeddingExtractor = (
  rawMessage: string,
  linkify: LinkifyIt,
  typeExtractor: EmbeddingTypeExtractor,
  idExtractor: EmbeddingIdExtractor
): EmbeddingsExtractedMessage => {
  const embeddings: EmbeddingOrUrl[] = []
  const knownIdSet: Set<string> = new Set()

  const matches = linkify.match(rawMessage) ?? []

  /** 連続したマッチの開始インデックス */
  let sequenceStartIndex = 0

  /** スペースを含んだ、連続したマッチ全体の終了インデックス */
  let sequenceEndIndex = 0

  /** 1つ前のマッチの`endIndex` */
  let prevEndIndex = 0

  for (const match of matches) {
    const startIndex = match.index
    const endIndex = match.lastIndex

    let url: URL
    try {
      url = new URL(match.url)
    } catch {
      continue // 不正なURLがlinkify-itから渡されたので無視
    }

    const ty = typeExtractor(url)
    const id = idExtractor(url, ty)

    if (ty === 'internal') {
      // 埋め込みと同じオリジンだが埋め込みに該当しない場合、urlではないとみなす
      // このためにシーケンスをここで終了する
      sequenceStartIndex = endIndex
      prevEndIndex = endIndex
      continue
    } else if (ty === 'url') {
      embeddings.push({ type: 'url', url: match.url, startIndex, endIndex })
    } else if (id && !knownIdSet.has(id)) {
      embeddings.push({ type: ty, id, startIndex, endIndex })
      knownIdSet.add(id)
    }

    // 前のマッチから連続しているかどうかの判定
    if (!checkBlank(rawMessage, prevEndIndex, startIndex)) {
      // 連続したマッチではなかった
      sequenceStartIndex = startIndex
    }
    sequenceEndIndex = endIndex
    prevEndIndex = endIndex
  }

  const hasSequenceReachedEos = checkBlank(
    rawMessage,
    sequenceEndIndex,
    rawMessage.length
  )

  return {
    rawText: rawMessage,
    text: hasSequenceReachedEos
      ? rawMessage.substring(0, sequenceStartIndex)
      : rawMessage,
    embeddings
  }
}

/**
 * markdownから埋め込みURLを抽出してすべて置換する
 *
 * @param typeIdExtractor マッチ結果から埋め込み/通常URLの種別を返す関数
 * @param idExtractor マッチ結果から埋め込みidを返す関数（通常URL時は`undefined`）
 */
export const embeddingReplacer = (
  rawMessage: string,
  linkify: LinkifyIt,
  typeExtractor: EmbeddingTypeExtractor,
  idExtractor: EmbeddingIdExtractor
): EmbeddingsExtractedMessage => {
  const { text, embeddings } = embeddingExtractor(
    rawMessage,
    linkify,
    typeExtractor,
    idExtractor
  )

  let newText = text
  // 置換で文字数がずれるのでずれた数を保持する
  let placeDiff = 0

  for (const embedding of embeddings) {
    // 末尾のものは抽出で消えているので置換しない
    // 通常のURL・内部URLも必要がないので置換しない
    if (
      embedding.type === 'url' ||
      embedding.type === 'internal' ||
      text.length <= embedding.startIndex
    ) {
      break
    }

    let replaced
    if (embedding.type === 'file') {
      replaced = '[[添付ファイル]]'
    } else if (embedding.type === 'message') {
      replaced = '[[添付メッセージ]]'
    } else {
      const invalid: never = embedding
      throw new Error(`embeddingReplacer unknown embedding type: ${invalid}`)
    }

    newText =
      newText.slice(0, placeDiff + embedding.startIndex) +
      replaced +
      newText.slice(placeDiff + embedding.endIndex)

    placeDiff += replaced.length - (embedding.endIndex - embedding.startIndex)
  }
  return { rawText: rawMessage, text: newText, embeddings }
}
