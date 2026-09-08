import type { PluginGroup } from './definitions.js'
import type { Plugin, Implementation } from './plugin.js'
import type { Preset, Handler } from './types.js'
import { implementation } from './plugin.js'

const presets = new WeakMap<Preset, Map<string, Handler>>()
export function handlers(preset: Preset) {
  const value = presets.get(preset)
  if (!value) throw new TypeError('Expected renderer Preset')
  return value
}

// Compare names only within selected declarations and their ancestor scopes.
function validateNames(plugins: Implementation[]) {
  const scopes = new Map<PluginGroup | null, Set<string>>(),
    groups = new Set<PluginGroup>()
  function add(parent: PluginGroup | null, name: string) {
    let names = scopes.get(parent)
    if (!names) scopes.set(parent, (names = new Set()))
    if (names.has(name)) throw new Error('Duplicate name: ' + name)
    names.add(name)
  }
  function group(value: PluginGroup | null) {
    if (!value || groups.has(value)) return
    group(value.parent)
    add(value.parent, value.name)
    groups.add(value)
  }
  for (const { declaration } of plugins) group(declaration.namespace)
  for (const { declaration } of plugins)
    add(declaration.namespace, declaration.name)
}

export class PresetBuilder {
  #plugins: Implementation[] = []
  add(plugin: Plugin) {
    const state = implementation(plugin)
    for (const existing of this.#plugins) {
      if (existing === state) throw new Error('Duplicate plugin')
      for (const kind of state.handlers.keys())
        if (existing.handlers.has(kind))
          throw new Error('Duplicate handler: ' + kind)
    }
    this.#plugins.push(state)
    return this
  }
  remove(plugin: Plugin) {
    const index = this.#plugins.indexOf(implementation(plugin))
    if (index < 0) throw new Error('Missing plugin')
    this.#plugins.splice(index, 1)
    return this
  }
  build() {
    validateNames(this.#plugins)
    const preset = Object.freeze({}) as Preset
    presets.set(preset, new Map(this.#plugins.flatMap(p => [...p.handlers])))
    return preset
  }
}
