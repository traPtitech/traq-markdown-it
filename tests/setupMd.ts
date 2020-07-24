import Md, { Store } from '#/index'

export const setup = (): Md => {
  const nameIdTable: Record<string, string> = {
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
    getUserByName: name =>
      nameIdTable[name] ? { iconFileId: nameIdTable[name] } : undefined,
    getStampByName: name =>
      nameIdTable[name] ? { name, fileId: nameIdTable[name] } : undefined
  }

  const md = new Md(store, [], 'https://example.com')

  return md
}
