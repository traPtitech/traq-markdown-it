import type MarkdownIt from 'markdown-it'
import regexp from '@traptitech/markdown-it-regexp'

// See stamp.ts stampRegExp
const stampRegExp = /:((?:[a-zA-Z0-9+_-]{1,32}|@[a-zA-Z0-9_-]+)[\w+-.]*):/
const stampRegExpWithSize =
  /:((?:[a-zA-Z0-9+_-]{1,32}|@[a-zA-Z0-9_-]+)[\w+-.]*)[:;]/

const renderUserStamp = (wrappedName: string, name: string, size: number) => {
  // 最初の@を取り除く
  const username = name.slice(1)

  return `<i class="emoji s${size}" title="${wrappedName}" style="background-image: url(https://q.trap.jp/api/v3/public/icon/${username})">${wrappedName}</i>`
}

const renderStamp = (wrappedName: string, name: string, size: number) => {
  const className = `e_${name.replace(/\+/g, '_-plus-_')}`
  return `<i class="emoji s${size} ${className}" title="${wrappedName}">${wrappedName}</i>`
}

export const stampCssPlugin = (
  md: MarkdownIt,
  stamps: readonly string[],
  enableSize = false
): void => {
  regexp(
    enableSize ? stampRegExpWithSize : stampRegExp,
    ([wrappedName = '', name = '']): string => {
      const size = enableSize ? (wrappedName.endsWith(':') ? 32 : 16) : 24

      if (name.startsWith('@')) {
        return renderUserStamp(wrappedName, name, size)
      }

      if (!stamps.includes(name)) return wrappedName
      return renderStamp(wrappedName, name, size)
    }
  )(md)
}
