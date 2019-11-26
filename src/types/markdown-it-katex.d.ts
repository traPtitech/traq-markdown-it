declare module '@traPtitech/markdown-it-katex' {
  import Md from 'markdown-it'
  import Katex from 'katex'

  interface Options {
    katex?: typeof Katex
    blockClass?: string
  }

  function katex(md: Md, options: Options): void

  export = katex
}
