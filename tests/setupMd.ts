import { traQMarkdownIt } from '#/traQMarkdownIt'
import { Store } from '#/Store'

export const setup = (): traQMarkdownIt => {
  const nameIdTable: Record<string, string> & { me: string } = {
    me: 'd7461966-e5d3-4c6d-9538-7c8605f45a1e',
    one: 'e97518db-ebb8-450f-9b4a-273234e68491',
    longlonglonglonglonglonglonglonglonglonglonglong:
      'e97518db-ebb8-450f-9b4a-273234e68491',
    'Webhook#random-Va1ue': 'e97518db-ebb8-450f-9b4a-273234e68491'
  }

  const store: Store = {
    getChannel: id =>
      id !== '00000000-0000-0000-0000-000000000000' ? { id } : undefined,
    getChannelPath: id =>
      Object.entries(nameIdTable).find(([, v]) => v === id)?.[0] ?? '',
    getMe: () => ({ id: nameIdTable.me }),
    getUser: id => ({ id }),
    getUserGroup: id => ({
      id,
      members: id === nameIdTable.one ? [{ id: nameIdTable.me, role: '' }] : []
    }),
    getUserByName: name => {
      const id = nameIdTable[name]
      return id ? { iconFileId: id } : undefined
    },
    getStampByName: name => {
      const id = nameIdTable[name]
      return id ? { name, fileId: id } : undefined
    }
  }

  const md = new traQMarkdownIt(store, [], 'https://example.com')

  return md
}
