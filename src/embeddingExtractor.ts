import type Token from 'markdown-it/lib/token'

const uuidRegexp = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/

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
  children: TokenWithEmbeddingData[] | null
  embedding?: EmbeddingOrUrl
}

export default class EmbeddingExtractor {
  readonly pathNameEmbeddingTypeMap: ReadonlyMap<string, Embedding['type']> =
    new Map([
      ['files', 'file'],
      ['messages', 'message']
    ] as const)
  readonly embeddingOrigin: string

  constructor(embeddingOrigin: string) {
    this.embeddingOrigin = embeddingOrigin
  }

  private extractType(url: Readonly<URL>): EmbeddingOrUrl['type'] {
    if (url.origin !== this.embeddingOrigin) return 'url'
    const name = url.pathname.split('/')[1] ?? ''
    return this.pathNameEmbeddingTypeMap.get(name) ?? 'internal'
  }

  private extractId(
    url: Readonly<URL>,
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
  private extractUrlsFromTokens(
    tokens: readonly TokenWithEmbeddingData[],
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

      if (token.type === 'link_open') {
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
  extract(tokens: readonly Token[]): EmbeddingOrUrl[] {
    const embeddings = this.extractUrlsFromTokens(tokens)
    const knownIdSet = new Set<string>()

    // かぶっているURLを取り除く(順序を保つため配列でそのまま行う)
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
   * paragraphのchildのtokenの配列から末尾の埋め込みを取り除く
   *
   * @param tokens ネストされていないtokenの配列
   * @returns 取り除かれたらtrue
   */
  removeTailEmbeddingsFromTailParagraph(
    tokens: Array<Readonly<TokenWithEmbeddingData>>
  ): boolean {
    /**
     * `token.type === 'link_open' && token.markup === 'linkify`と
     * `token.type === 'link_close' && token.markup === 'linkify`の間にいるかどうか
     * `token.markup === 'linkify'`で[]()の形式のリンクは無視
     */
    let isInLink = false
    /**
     * 取り除く埋め込みのトークンの先頭位置
     * ここから最後までを取り除く
     */
    let removeStartIndex = -1

    for (let i = tokens.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const token = tokens[i]!
      if (token.type === 'softbreak') {
        // 取り除かれた埋め込みの直前の改行を取り除く
        if (removeStartIndex > 0 && !isInLink) {
          removeStartIndex = i
        }
        continue
      }

      if (token.type === 'link_open' && token.markup === 'linkify') {
        isInLink = false
        const type = token.embedding?.type
        if (type === 'file' || type === 'message') {
          removeStartIndex = i
          continue
        }
        // 埋め込みでないリンクのときそのまま進む
        // (breakすると埋め込みでないものが埋め込みが来る前に来たときの検知ができない)
      }
      if (isInLink) continue

      if (token.type === 'link_close' && token.markup === 'linkify') {
        isInLink = true
        continue
      }

      // 埋め込みでないものが埋め込みが来る前に来たとき
      if (removeStartIndex === -1) {
        return false
      }

      break
    }
    // 終了時
    tokens.splice(removeStartIndex, tokens.length - removeStartIndex)
    return true
  }

  /**
   * 末尾の埋め込みURLを除去する
   *
   * 末尾から「改行」の連続(あってもなくてもよい)、「「埋め込み」を含むparagraph」の場合だけを確認する
   */
  removeTailEmbeddings(tokens: Array<Readonly<TokenWithEmbeddingData>>): void {
    /**
     * `token.type === 'paragraph_open'`と`token.type === 'paragraph_close'`の間にいるかどうか
     */
    let isInParagraph = false
    /**
     * `token.type === 'paragraph_close'`が一旦除去されるので復元のために保持しておく
     */
    let paragraphCloseToken = undefined

    for (let i = tokens.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const token = tokens[i]!
      if (token.type === 'hardbreak') continue
      if (token.type === 'paragraph_close') {
        isInParagraph = true
        paragraphCloseToken = token
        continue
      }

      if (!(isInParagraph && token.type === 'inline') || !token.children) {
        return
      }

      // ここからparagraph内のchildrenをもっている`token.type === 'inline'`のとき

      const removed = this.removeTailEmbeddingsFromTailParagraph(token.children)
      if (removed) {
        tokens.splice(i + 1, tokens.length - (i + 1))

        const lastToken = tokens[tokens.length - 1]
        if (
          lastToken &&
          lastToken.type === 'inline' &&
          lastToken.children?.length === 0
        ) {
          tokens.pop()
        }
        if (paragraphCloseToken) {
          tokens.push(paragraphCloseToken)
        }
      }
    }
  }

  /**
   * markdownから埋め込みURLを抽出してすべて置換する
   */
  replace(tokens: readonly TokenWithEmbeddingData[]): void {
    /**
     * 今居る場所が挟まれているlinkのトークン
     */
    let linkOpenToken: Required<TokenWithEmbeddingData> | undefined = undefined

    for (const token of tokens) {
      if (token.children) {
        this.replace(token.children)
        continue
      }

      if (token.embedding) {
        linkOpenToken = token as Required<TokenWithEmbeddingData>
      }
      if (!linkOpenToken) continue
      if (token.type === 'text') {
        if (linkOpenToken.embedding.type === 'message') {
          token.content = '[[引用メッセージ]]'
        } else if (linkOpenToken.embedding.type === 'file') {
          token.content = '[[添付ファイル]]'
        }
        continue
      }
      if (token.type === 'link_close' && token.markup === 'linkify') {
        linkOpenToken = undefined
        continue
      }
    }
  }
}
