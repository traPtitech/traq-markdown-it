import type { Document, Node } from '../core/types.js'
import { names, isKnownNode } from '@traq-markdown-parser/traq/commonmark/nodes'
import { names as trap } from '@traq-markdown-parser/traq/trap/nodes'

export type Embedding =
  | { type: 'file' | 'message'; id: string }
  | { type: 'url'; url: string }

/** traQ links describe cards; external links describe OGP candidates. */
export function embeddingFromUrl(
  value: string,
  origin: string
): Embedding | undefined {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return
  if (url.origin !== origin) return { type: 'url', url: value }

  const [, kind, id = ''] = url.pathname.split('/')
  if (
    (kind === 'files' || kind === 'messages') &&
    /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/.test(id)
  )
    return { type: kind === 'files' ? 'file' : 'message', id }
}

interface EmbeddingState {
  links: Map<Node, Embedding>
  embeddings: Embedding[]
}

function collectEmbeddings(
  nodes: Node[],
  origin: string,
  state: EmbeddingState,
  ids: Set<string>
) {
  for (const node of nodes) {
    if (node.kind === trap.Spoiler) continue

    if (isKnownNode(node) && node.kind === names.Link) {
      const embedding = embeddingFromUrl(node.data.destination, origin)

      if (embedding) {
        state.links.set(node, embedding)

        if (embedding.type === 'url' || !ids.has(embedding.id)) {
          state.embeddings.push(embedding)

          if (embedding.type !== 'url') ids.add(embedding.id)
        }
      }
    }

    if (node.children) collectEmbeddings(node.children, origin, state, ids)
  }
}

function trimTrailingEmbeddings(children: Node[], links: Map<Node, Embedding>) {
  const result = children.slice()
  let last = result.length - 1

  while (result[last]?.kind === trap.BlankLine) last--

  const paragraph = result[last]
  if (paragraph?.kind !== names.Paragraph || !paragraph.children) return result

  let end = paragraph.children.length - 1
  let removed = false

  while (end >= 0) {
    const node = paragraph.children[end]
    const embedding = links.get(node)

    if (node.kind === names.Softbreak) {
      end--
      continue
    }

    if (
      embedding &&
      embedding.type !== 'url' &&
      isKnownNode(node) &&
      node.kind === names.Link &&
      node.data.form === 'linkify'
    ) {
      removed = true
      end--
      continue
    }

    break
  }

  if (removed) {
    result[last] = {
      ...paragraph,
      children: paragraph.children.slice(0, end + 1)
    }
    result.length = last + 1
  }

  return result
}

function replaceEmbeddingLabels(
  nodes: Node[],
  links: Map<Node, Embedding>
): Node[] {
  return nodes.map(node => {
    const embedding = links.get(node)

    if (
      embedding &&
      (embedding.type === 'file' ||
        (embedding.type === 'message' &&
          isKnownNode(node) &&
          node.kind === names.Link &&
          node.data.form === 'linkify'))
    )
      return {
        ...node,
        children: [
          {
            kind: names.Text,
            span: node.span,
            data: {
              value:
                embedding.type === 'file'
                  ? '[[添付ファイル]]'
                  : '[[引用メッセージ]]'
            }
          }
        ]
      }

    return node.children
      ? { ...node, children: replaceEmbeddingLabels(node.children, links) }
      : node
  })
}

/** Does not mutate the parser's document; both presentations can reuse it. */
export function prepareMessage(
  document: Document,
  origin: string,
  preview: boolean
) {
  const state: EmbeddingState = {
    links: new Map(),
    embeddings: []
  }

  collectEmbeddings(document.children, origin, state, new Set())

  const children = trimTrailingEmbeddings(document.children, state.links)
  const renderedChildren = preview
    ? replaceEmbeddingLabels(children, state.links)
    : children

  return {
    document: { ...document, children: renderedChildren },
    embeddings: state.embeddings
  }
}
