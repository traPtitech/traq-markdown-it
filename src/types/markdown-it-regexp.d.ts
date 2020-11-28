declare module '@traptitech/markdown-it-regexp' {
  import Md from 'markdown-it'

  function regexp(
    reg: RegExp,
    fn: (match: RegExpMatchArray) => string
  ): (md: Md) => void

  export = regexp
}
