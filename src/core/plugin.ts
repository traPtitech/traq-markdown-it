import type { Handler } from './types.js'
import { Plugin as Declaration } from './definitions.js'

export interface Implementation {
  declaration: Declaration
  handlers: Map<string, Handler>
}

const implementations = new WeakMap<Plugin, Implementation>()

export function implementation(plugin: Plugin) {
  const value = implementations.get(plugin)
  if (!value) throw new TypeError('Expected renderer Plugin')
  return value
}

export class Plugin {
  constructor(declaration: Declaration) {
    if (!(declaration instanceof Declaration))
      throw new TypeError('Expected Plugin declaration')

    implementations.set(this, { declaration, handlers: new Map() })
  }

  on(kind: string, handler: Handler) {
    return this.#set(kind, handler, false)
  }

  replace(kind: string, handler: Handler) {
    return this.#set(kind, handler, true)
  }

  #set(kind: string, handler: Handler, replacing: boolean) {
    if (typeof kind !== 'string' || typeof handler !== 'function')
      throw new TypeError('Expected node kind and render handler')

    const state = implementation(this)

    if (state.handlers.has(kind) !== replacing)
      throw new Error(
        (replacing ? 'Missing' : 'Duplicate') + ' handler: ' + kind
      )

    const handlers = new Map(state.handlers)
    handlers.set(kind, handler)

    implementations.set(this, { declaration: state.declaration, handlers })
    return this
  }
}
