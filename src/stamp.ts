import MarkdownIt from 'markdown-it'
import regexp from 'markdown-it-regexp'
import { escapeHtml } from './util'
import { Store } from './Store'

let store: Pick<Store, 'getUserByName' | 'getStampByName'>
let baseUrl = ''

const animeEffectSet = new Set([
  'rotate',
  'rotate-inv',
  'wiggle',
  'parrot',
  'zoom',
  'inversion',
  'turn',
  'turn-v',
  'happa',
  'pyon',
  'flashy',
  'pull',
  'atsumori',
  'stretch',
  'stretch-v',
  'conga',
  'conga-inv',
  'marquee',
  'marquee-inv',
  'rainbow',
  'ascension',
  'shake'
] as const)
const sizeEffectSet = new Set(['ex-large', 'large', 'small'] as const)

type SetOf<T> = T extends Set<infer S> ? S : never
type AnimeEffect = SetOf<typeof animeEffectSet>
type SizeEffect = SetOf<typeof sizeEffectSet>

const animeEffectAliasMap = new Map<AnimeEffect, AnimeEffect>([
  ['marquee', 'conga'],
  ['marquee-inv', 'conga-inv']
])

const maxEffectCount = 5

const wrapWithEffect = (
  stampHtml: string,
  animeEffects: AnimeEffect[],
  sizeEffect: SizeEffect
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

const renderStampDomWithStyle = (
  rawMatch: string,
  stampName: string,
  imgTitle: string,
  style: string,
  effects: string[]
): string => {
  const escapedTitle = escapeHtml(imgTitle)
  const escapedStyle = escapeHtml(style)
  const escapedName = escapeHtml(stampName)

  const sizeEffects = effects.filter((e): e is SizeEffect =>
    sizeEffectSet.has(e as SizeEffect)
  )
  const animeEffects = effects.filter((e): e is AnimeEffect =>
    animeEffectSet.has(e as AnimeEffect)
  )

  // 知らないエフェクトはダメ
  if (sizeEffects.length + animeEffects.length < effects.length) {
    return rawMatch
  }

  // アニメーション系エフェクトは5つまで
  if (animeEffects.length > maxEffectCount) {
    return rawMatch
  }

  // aliasの置き換え
  const replacedAnimeEffects = animeEffects.map(e =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    animeEffectAliasMap.has(e) ? animeEffectAliasMap.get(e)! : e
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
  effects: string[]
): string =>
  renderStampDomWithStyle(
    rawMatch,
    stampName,
    imgTitle,
    `background-image: url(${imgUrl})`,
    effects
  )

const stampReg = /[a-zA-Z0-9+_-]{1,32}/
export const hslReg = /(?<color>hsl\(\d+,\s*[\d]+(?:\.[\d]+)?%,\s*[\d]+(?:\.[\d]+)?%\))(?<effects>.*)/
export const hexReg = /0x(?<color>[0-9a-fA-F]{6})(?<effects>.*)/

interface ColorRegExpGroup {
  color: string
  effects: string
}

export const renderHslStamp = (match: RegExpExecArray): string => {
  // HSL: hsl(..., ...%, ...%)
  const { color, effects } = (match.groups as unknown) as ColorRegExpGroup

  return renderStampDomWithStyle(
    `:${match[0]}:`,
    color,
    color,
    `background-color: ${color}`,
    effects === '' ? [] : effects.split('.').slice(1)
  )
}

export const renderHexStamp = (match: RegExpExecArray): string => {
  // Hex: 0x......
  const { color, effects } = (match.groups as unknown) as ColorRegExpGroup

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
  effects: string[]
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
  effects: string[]
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

export const renderStamp = (match: RegExpMatchArray): string => {
  // ここはbabelの変換が効かない
  const { inner }: StampRegExpGroups = { inner: match[1] }

  const hexMatch = hexReg.exec(inner)
  if (hexMatch) {
    return renderHexStamp(hexMatch)
  }

  const hslMatch = hslReg.exec(inner)
  if (hslMatch) {
    return renderHslStamp(hslMatch)
  }

  if (!stampReg.exec(inner)) {
    return match[0]
  }

  const [stampName, ...effects] = inner.split('.')

  // ユーザーアイコン
  if (stampName.startsWith('@')) {
    return renderUserStamp(stampName, match[0], effects)
  }

  // 通常スタンプ
  return renderNormalStamp(stampName, match[0], effects)
}

/**
 * `@?[a-zA-Z0-9+_-]{1,32}`の部分が通常のスタンプ
 * `\w+\([^:<>"'=+!?]+\)`の部分が色のスタンプ
 * [\w+-.]*の部分がスタンプエフェクト
 *
 * babelの変換が効かないので今はnamed capture groupsを使わない
 */
const stampRegExp = /:((?:@?[a-zA-Z0-9+_-]{1,32}|\w+\([^:<>"'=+!?]+\))[\w+-.]*):/
interface StampRegExpGroups {
  /**
   * :を除いた部分
   */
  inner: string
}

export default function stampPlugin(
  md: MarkdownIt,
  _store: Pick<Store, 'getUserByName' | 'getStampByName'>,
  _baseUrl?: string
): void {
  store = _store
  if (_baseUrl) {
    baseUrl = _baseUrl
  }
  regexp(stampRegExp, renderStamp)(md)
}
