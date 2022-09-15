import type { User, Channel, UserGroup, Stamp } from '@traptitech/traq'

export interface Store {
  getUser(id: string): Readonly<Pick<User, 'id'>> | undefined
  getChannel(id: string): Readonly<Pick<Channel, 'id'>> | undefined
  getUserGroup(id: string): Readonly<Pick<UserGroup, 'members'>> | undefined
  getMe(): Readonly<Pick<User, 'id'>> | undefined
  getStampByName(
    name: string
  ): Readonly<Pick<Stamp, 'name' | 'fileId'>> | undefined
  getUserByName(name: string): Readonly<Pick<User, 'iconFileId'>> | undefined
  /**
   * href属性にセットされるので`javascript:`などのXSSに注意すること
   */
  generateUserHref(id: string): string
  /**
   * href属性にセットされるので`javascript:`などのXSSに注意すること
   */
  generateUserGroupHref(id: string): string
  /**
   * href属性にセットされるので`javascript:`などのXSSに注意すること
   */
  generateChannelHref(id: string): string
}
