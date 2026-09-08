export interface Options {
  validateLink?(destination: string): boolean
  validateImage?(destination: string): boolean
  breaks?: boolean

  /** Return highlighted HTML, or an empty string to use escaped code. */
  highlight?(code: string, language: string): string

  linkAttributes?: Readonly<Record<string, string>>
}
