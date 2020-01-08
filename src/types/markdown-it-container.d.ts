declare module 'markdown-it-container' {
  import Md from 'markdown-it'

  function container(
    md: Md,
    name: string,
    options?: {
      validate?: (params: string) => boolean
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render?: (tokens: any, index: number) => string
      marker?: string
    }
  ): void

  export = container
}
