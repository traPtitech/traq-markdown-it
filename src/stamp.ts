import type MarkdownIt from 'markdown-it'
import regexp from '@traptitech/markdown-it-regexp'
import { escapeHtml } from './util'
import type { Store } from './Store'
import { animeEffects, sizeEffects } from './data/stampEffects'

let store: Readonly<Pick<Store, 'getUserByName' | 'getStampByName'>>
let baseUrl = ''

export const animeEffectSet: ReadonlySet<string> = new Set(animeEffects)
export const sizeEffectSet: ReadonlySet<string> = new Set(sizeEffects)
export type AnimeEffect = typeof animeEffects[number]
export type SizeEffect = typeof sizeEffects[number]

const animeEffectAliasMap: ReadonlyMap<AnimeEffect, AnimeEffect> = new Map([
  ['marquee', 'conga'],
  ['marquee-inv', 'conga-inv']
] as const)

const maxEffectCount = 5

const wrapWithEffect = (
  stampHtml: string,
  animeEffects: readonly AnimeEffect[],
  sizeEffect: SizeEffect | ''
): string => {
  const filterOpenTag = animeEffects
    .map(
      (e, i) =>
        `<span class="emoji-effect ${e}${
          i === 0 && sizeEffect ? ` ${sizeEffect}` : ''
        }">`
    )
    .join('')
  const filterCloseTag = '</span>'.repeat(animeEffects.length)
  return filterOpenTag + stampHtml + filterCloseTag
}

const isSizeEffect = (e: string): e is SizeEffect => sizeEffectSet.has(e)
const isAnimeEffect = (e: string): e is AnimeEffect => animeEffectSet.has(e)

const renderStampDomWithStyle = (
  rawMatch: string,
  stampName: string,
  imgTitle: string,
  style: string,
  effects: readonly string[]
): string => {
  const escapedTitle = escapeHtml(imgTitle)
  const escapedStyle = escapeHtml(style)
  const escapedName = escapeHtml(stampName)

  const sizeEffects = effects.filter(isSizeEffect)
  const animeEffects = effects.filter(isAnimeEffect)

  // 知らないエフェクトはダメ
  if (sizeEffects.length + animeEffects.length < effects.length) {
    return rawMatch
  }

  // アニメーション系エフェクトは5つまで
  if (animeEffects.length > maxEffectCount) {
    return rawMatch
  }

  // aliasの置き換え
  const replacedAnimeEffects = animeEffects.map(
    e => animeEffectAliasMap.get(e) ?? e
  )

  // 複数サイズ指定が合った場合は最後のものを適用
  const sizeEffectClass = sizeEffects[sizeEffects.length - 1] || ''

  const stampHtml = `<i class="emoji message-emoji ${sizeEffectClass}" title=":${escapedTitle}:" style="${escapedStyle};">:${escapedName}:</i>`

  return wrapWithEffect(stampHtml, replacedAnimeEffects, sizeEffectClass)
}

const renderStampDom = (
  rawMatch: string,
  stampName: string,
  imgTitle: string,
  imgUrl: string,
  effects: readonly string[]
): string =>
  renderStampDomWithStyle(
    rawMatch,
    stampName,
    imgTitle,
    `background-image: url(${imgUrl})`,
    effects
  )

const stampReg = /^[a-zA-Z0-9+_-]{1,32}$/
export const hslReg =
  /(?<color>hsl\(\d+,\s*[\d]+(?:\.[\d]+)?%,\s*[\d]+(?:\.[\d]+)?%\))(?<effects>.*)/
export const hexReg = /0x(?<color>[0-9a-fA-F]{6})(?<effects>.*)/

interface ColorRegExpGroup {
  color: string
  effects: string
}

export const renderHslStamp = (match: Readonly<RegExpExecArray>): string => {
  // HSL: hsl(..., ...%, ...%)
  const { color, effects } = match.groups as Readonly<ColorRegExpGroup>

  return renderStampDomWithStyle(
    `:${match[0]}:`,
    color,
    color,
    `background-color: ${color}`,
    effects === '' ? [] : effects.split('.').slice(1)
  )
}

export const renderHexStamp = (match: Readonly<RegExpExecArray>): string => {
  // Hex: 0x......
  const { color, effects } = match.groups as Readonly<ColorRegExpGroup>

  return renderStampDomWithStyle(
    `:${match[0]}:`,
    `0x${color}`,
    `0x${color}`,
    `background-color: #${color}`,
    effects === '' ? [] : effects.split('.').slice(1)
  )
}

export const renderUserStamp = (
  stampName: string,
  raw: string,
  effects: readonly string[]
): string => {
  // 先頭の@を除いたものがユーザー名
  const userName = stampName.slice(1)
  const user = store.getUserByName(userName)
  if (!user) {
    return raw
  }

  return renderStampDom(
    raw,
    stampName,
    stampName,
    `${baseUrl}/api/v3/files/${user.iconFileId}`,
    effects
  )
}

export const renderNormalStamp = (
  stampName: string,
  raw: string,
  effects: readonly string[]
): string => {
  const stamp = store.getStampByName(stampName)
  if (!stamp) {
    return raw
  }

  return renderStampDom(
    raw,
    stampName,
    stamp.name,
    `${baseUrl}/api/v3/files/${stamp.fileId}`,
    effects
  )
}

export const renderStamp = (match: Readonly<RegExpMatchArray>): string => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const raw = match[0]!
  const inner = raw.slice(1, -1)

  const hexMatch = hexReg.exec(inner)
  if (hexMatch) {
    return renderHexStamp(hexMatch)
  }

  const hslMatch = hslReg.exec(inner)
  if (hslMatch) {
    return renderHslStamp(hslMatch)
  }

  const [stampName, ...effects] = inner.split('.') as [string, ...string[]]

  // ユーザーアイコン
  if (stampName.startsWith('@')) {
    return renderUserStamp(stampName, raw, effects)
  }

  if (!stampReg.exec(stampName)) {
    return raw
  }

  // 通常スタンプ
  return renderNormalStamp(stampName, raw, effects)
}

/**
 * `[a-zA-Z0-9+_-]{1,32}`の部分が通常のスタンプ
 * `@(?:Webhook#)?[a-zA-Z0-9_-]+`の部分がユーザーアイコンスタンプ
 * `\w+\([^:<>"'=+!?]+\)`の部分が色のスタンプ
 * (?:\.[\w+-.]+)?の部分がスタンプエフェクト
 */
const stampRegExp =
  /:(?:[a-zA-Z0-9+_-]{1,32}|@(?:Webhook#)?[a-zA-Z0-9_-]+|\w+\([^:<>"'=+!?]+\))(?:\.[\w+-.]+)?:/

/**
 * @param _baseUrl スタンプの画像の`/api/v3`の前につくURLの部分 (tailing slashなし)
 */
export default function stampPlugin(
  md: MarkdownIt,
  _store: Readonly<Pick<Store, 'getUserByName' | 'getStampByName'>>,
  _baseUrl?: string
): void {
  store = _store
  if (_baseUrl) {
    baseUrl = _baseUrl
  }
  regexp(stampRegExp, renderStamp)(md)
}
