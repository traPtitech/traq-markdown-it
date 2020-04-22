import { User, Channel, UserGroup, Stamp } from '@traptitech/traq'

export interface Store {
  getUser(id: string): Pick<User, 'id'> | undefined
  getChannel(id: string): Pick<Channel, 'id'> | undefined
  getChannelPath(id: string): string
  getUserGroup(id: string): Pick<UserGroup, 'members'> | undefined
  getMe(): Pick<User, 'id'> | undefined
  getStampByName(name: string): Pick<Stamp, 'name' | 'fileId'> | undefined
  getUserByName(name: string): Pick<User, 'iconFileId'> | undefined
}
