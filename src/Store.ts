interface Group {
  members: string[]
}

interface Stamp {
  name: string
  fileId: string
}

export interface Store {
  getMember(id: string): unknown
  getChannel(id: string): { channelId: string } | undefined
  getChannelPath(id: string): unknown
  getGroup(id: string): Group | undefined
  getMe(): { userId: string }
  getStampFromName(name: string): Stamp
  getUserByName(name: string): { iconFileId: string }
}
