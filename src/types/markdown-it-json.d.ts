declare module 'markdown-it-json' {
  import Md from 'markdown-it'
  import StateCore from 'markdown-it/lib/rules_core/state_core'

  function json(
    validate: (object: unknown) => boolean,
    transform: (state: StateCore, obj: unknown) => void
  ): (md: Md) => void

  export = json
}
