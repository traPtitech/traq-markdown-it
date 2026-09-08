/** Structural AST input; grammar packages own the payload types. */
export interface Node {
  kind: string
  span: { start: number; end: number }
  data: unknown
  children?: Node[]
}

export interface Document {
  source: string
  children: Node[]
}

export interface RenderContext {
  /** Ancestors in outermost-to-innermost order, excluding the current node. */
  ancestors: readonly Node[]
  source: string
  /** Escape text before including it in a custom HTML handler. */
  escape(text: string): string
  inline(nodes?: Node[]): string
  blocks(nodes?: Node[]): string
  fallback(node: Node): string
}

/** Handlers return trusted HTML. Escape values obtained from the document. */
export type Handler = (node: Node, context: RenderContext) => string

declare const identity: unique symbol

export interface Preset {
  readonly [identity]: 'renderer-preset'
}

export interface Renderer {
  render(document: Document): string
  renderInline(document: Document): string
}
