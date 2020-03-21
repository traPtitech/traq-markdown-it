import MarkdownIt from 'markdown-it'
import regexp from 'markdown-it-regexp'
import { escapeHtml } from './util'
import { Store } from './Store'

let store: Store
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
  'rainbow'
])
const sizeEffectSet = new Set(['ex-large', 'large', 'small'])

const animeEffectAliasMap = new Map([
  ['marquee', 'conga'],
  ['marquee-inv', 'conga-inv']
])

const maxEffectCount = 5

const wrapWithEffect = (
  stampHtml: string,
  animeEffects: string[],
  sizeEffect: string
): string => {
  const filterOpenTag = animeEffects
    .map(
      (e, i) =>
        `<span class="emoji-effect ${e}${
          i == 0 && sizeEffect ? ` ${sizeEffect}` : ''
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

  const sizeEffects = effects.filter(e => sizeEffectSet.has(e))
  const animeEffects = effects.filter(e => animeEffectSet.has(e))

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

  const stampHtml = `<i class="emoji s24 message-emoji ${sizeEffectClass}" title=":${escapedTitle}:" style="${escapedStyle};">:${escapedName}:</i>`

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
const hslReg = /(hsl\(\d+,\s*[\d]+(?:\.[\d]+)?%,\s*[\d]+(?:\.[\d]+)?%\))(.*)/
const hexReg = /0x([0-9a-f]{6})(.*)/

const renderHslStamp = (match: RegExpExecArray): string => {
  // HSL: hsl(..., ...%, ...%)
  const effects = match[2] === '' ? [] : match[2].split('.').slice(1)
  return renderStampDomWithStyle(
    `:${match[0]}:`,
    match[1],
    match[1],
    `background-color: ${match[1]}`,
    effects
  )
}

const renderHexStamp = (match: RegExpExecArray): string => {
  // Hex: 0x......
  const effects = match[2] === '' ? [] : match[2].split('.').slice(1)
  return renderStampDomWithStyle(
    `:${match[0]}:`,
    `0x${match[1]}`,
    `0x${match[1]}`,
    `background-color: #${match[1]}`,
    effects
  )
}

export const renderStamp = (match: RegExpMatchArray): string => {
  // match[1] は:を除いた部分
  const hexMatch = hexReg.exec(match[1])
  if (hexMatch) {
    return renderHexStamp(hexMatch)
  }

  const hslMatch = hslReg.exec(match[1])
  if (hslMatch) {
    return renderHslStamp(hslMatch)
  }

  if (!stampReg.exec(match[1])) {
    return match[0]
  }

  const splitted = match[1].split('.')
  const stampName = splitted[0]
  const effects = splitted.length > 1 ? splitted.slice(1) : []

  const stamp = store.getStampByName(stampName)
  const user = store.getUserByName(stampName)
  if (stamp) {
    // 通常スタンプ
    return renderStampDom(
      match[0],
      stampName,
      stamp.name ?? '',
      `${baseUrl}/api/1.0/files/${stamp.fileId ?? ''}`,
      effects
    )
  } else if (user) {
    // ユーザーアイコン
    return renderStampDom(
      match[0],
      stampName,
      stampName,
      `${baseUrl}/api/1.0/files/${user.iconFileId ?? ''}`,
      effects
    )
  }

  return match[0]
}

export default function stampPlugin(
  md: MarkdownIt,
  _store: Store,
  _baseUrl?: string
): void {
  store = _store
  if (_baseUrl) {
    baseUrl = _baseUrl
  }
  regexp(
    /:((?:[a-zA-Z0-9+_-]{1,32}|\w+\([^:<>"'=+!?]+\))[\w+-.]*):/,
    renderStamp
  )(md)
}
