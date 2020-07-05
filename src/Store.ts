import { User, Channel, UserGroup, Stamp } from '@traptitech/traq'

export interface Store {
  getUser(id: string): Readonly<Pick<User, 'id'>> | undefined
  getChannel(id: string): Readonly<Pick<Channel, 'id'>> | undefined
  getChannelPath(id: string): string
  getUserGroup(id: string): Readonly<Pick<UserGroup, 'members'>> | undefined
  getMe(): Pick<User, 'id'> | undefined
  getStampByName(
    name: string
  ): Readonly<Pick<Stamp, 'name' | 'fileId'>> | undefined
  getUserByName(name: string): Readonly<Pick<User, 'iconFileId'>> | undefined
}
