function label(name: string) {
  if (typeof name !== 'string') throw new TypeError('Expected display name')
  return name
}

/** Identity is the instance; names are only used in diagnostics. */
export class PluginGroup {
  declare private readonly identity: void
  readonly name: string
  readonly parent: PluginGroup | null
  constructor(name: string, parent: PluginGroup | null = null) {
    if (parent !== null && !(parent instanceof PluginGroup))
      throw new TypeError('Expected PluginGroup')

    this.name = label(name)
    this.parent = parent

    Object.freeze(this)
  }

  group(name: string) {
    return new PluginGroup(name, this)
  }

  new(name: string) {
    return new Plugin(name, this)
  }
}

export class Plugin {
  declare private readonly identity: void
  readonly name: string
  readonly namespace: PluginGroup | null
  constructor(name: string, namespace: PluginGroup | null = null) {
    if (namespace !== null && !(namespace instanceof PluginGroup))
      throw new TypeError('Expected PluginGroup')

    this.name = label(name)
    this.namespace = namespace

    Object.freeze(this)
  }

  static group(name: string) {
    return new PluginGroup(name)
  }
}
