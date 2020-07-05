declare module 'markdown-it-image-filter' {
  import Md from 'markdown-it'

  interface Options {
    httpsOnly: boolean
  }

  function imgFilter(
    domains: readonly string[],
    options: Options
  ): (md: Md) => void

  export = imgFilter
}
