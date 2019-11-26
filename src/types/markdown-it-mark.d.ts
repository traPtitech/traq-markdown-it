declare module 'markdown-it-mark' {
  import Md from 'markdown-it'

  function mark(md: Md): void

  export = mark
}
