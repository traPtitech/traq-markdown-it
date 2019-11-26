declare module 'markdown-it-spoiler' {
  import Md from 'markdown-it'

  function spoiler(md: Md, frontPriorMode: boolean): void

  export = spoiler
}
