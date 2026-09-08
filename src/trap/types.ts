export interface Store {
  getMe?(): Readonly<{ id: string }> | undefined

  getUserGroup?(
    id: string
  ): Readonly<{ members: readonly Readonly<{ id: string }>[] }> | undefined

  getStampByName?(
    name: string
  ): Readonly<{ name: string; fileId: string }> | undefined

  getUserByName?(name: string): Readonly<{ iconFileId: string }> | undefined

  generateUserHref?(id: string): string
  generateUserGroupHref?(id: string): string
  generateChannelHref?(id: string): string
  generateStampHref?(fileId: string): string
}

export interface Options {
  store?: Readonly<Store>
  baseUrl?: string
  validateLink?(destination: string): boolean
}
