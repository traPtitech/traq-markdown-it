import { User, Channel, UserGroup, Stamp } from '@traptitech/traq'

export interface Store {
  getUser(id: string): User | undefined
  getChannel(id: string): Channel | undefined
  getChannelPath(id: string): string
  getUserGroup(id: string): UserGroup | undefined
  getMe(): User
  getStampByName(name: string): Stamp | undefined
  getUserByName(name: string): User | undefined
}
