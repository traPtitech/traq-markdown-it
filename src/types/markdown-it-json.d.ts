declare module 'markdown-it-json' {
  import Md from 'markdown-it'
  import StateBlock from 'markdown-it/lib/rules_block/state_block'
  import StateInline from 'markdown-it/lib/rules_inline/state_inline'

  function json(
    validate: (object: unknown) => boolean,
    transform: (state: StateBlock | StateInline, obj: unknown) => void
  ): (md: Md) => void

  export = json
}
