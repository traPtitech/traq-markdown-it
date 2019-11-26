declare module 'markdown-it-link-attributes' {
  import Md from 'markdown-it'

  interface Configs {
    attrs: {
      target: string
      rel: string
    }
  }

  function linkAttrs(md: Md, options: Configs): void

  export = linkAttrs
}
