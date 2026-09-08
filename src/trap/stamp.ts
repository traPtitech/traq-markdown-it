import type { Options } from './index.js'

import { escapeHtml } from '../core/html.js'
import { validateLink } from '../commonmark/policy.js'
import { animeEffects, sizeEffects } from './stamp-effects.js'

const animeEffectSet = new Set(animeEffects)
const sizeEffectSet = new Set(sizeEffects)
const animeEffectAliasMap = new Map([
  ['marquee', 'conga'],
  ['marquee-inv', 'conga-inv']
])
const maxEffectCount = 5
const wrapWithEffect = (
  stampHtml: string,
  animeEffects: string[],
  sizeEffect: string
) => {
  const filterOpenTag = animeEffects
    .map(
      (e, i) =>
        `<span class="emoji-effect ${e}${i === 0 && sizeEffect ? ` ${sizeEffect}` : ''}">`
    )
    .join('')
  const filterCloseTag = '</span>'.repeat(animeEffects.length)
  return filterOpenTag + stampHtml + filterCloseTag
}
const isSizeEffect = (e: string) => sizeEffectSet.has(e)
const isAnimeEffect = (e: string) => animeEffectSet.has(e)
const renderStampDomWithStyle = (
  rawMatch: string,
  stampName: string,
  imgTitle: string,
  style: string,
  effects: string[]
) => {
  const escapedTitle = escapeHtml(imgTitle)
  const escapedStyle = escapeHtml(style)
  const escapedName = escapeHtml(stampName)
  const sizeEffects = effects.filter(isSizeEffect)
  const animeEffects = effects.filter(isAnimeEffect)
  // 知らないエフェクトはダメ
  if (sizeEffects.length + animeEffects.length < effects.length) {
    return escapeHtml(rawMatch)
  }
  // アニメーション系エフェクトは5つまで
  if (animeEffects.length > maxEffectCount) {
    return escapeHtml(rawMatch)
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
  effects: string[]
) => {
  if (!validateLink(imgUrl) || /^(?:mailto|ftp):/i.test(imgUrl))
    return escapeHtml(rawMatch)
  const safeUrl = imgUrl.replace(
    /[\s"'()\\]/g,
    c => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  )
  return renderStampDomWithStyle(
    rawMatch,
    stampName,
    imgTitle,
    'background-image: url(' + safeUrl + ')',
    effects
  )
}
const stampReg = /^[a-zA-Z0-9+_-]{1,32}$/
const hslReg =
  /(?<color>hsl\(\d+,\s*[\d]+(?:\.[\d]+)?%,\s*[\d]+(?:\.[\d]+)?%\))(?<effects>.*)/
const hexReg = /0x(?<color>[0-9a-fA-F]{6})(?<effects>.*)/
const renderHslStamp = (match: RegExpExecArray) => {
  // HSL: hsl(..., ...%, ...%)
  const { color, effects } = match.groups!
  return renderStampDomWithStyle(
    `:${match[0]}:`,
    color,
    color,
    `background-color: ${color}`,
    effects === '' ? [] : effects.split('.').slice(1)
  )
}
const renderHexStamp = (match: RegExpExecArray) => {
  // Hex: 0x......
  const { color, effects } = match.groups!
  return renderStampDomWithStyle(
    `:${match[0]}:`,
    `0x${color}`,
    `0x${color}`,
    `background-color: #${color}`,
    effects === '' ? [] : effects.split('.').slice(1)
  )
}

export function stampRenderer({ store, baseUrl = '' }: Options = {}) {
  const getStampImageUrl = (fileId: string) => {
    if (store?.generateStampHref) {
      return store.generateStampHref(fileId)
    }
    return `${baseUrl}/api/v3/files/${encodeURIComponent(fileId)}`
  }
  const renderUserStamp = (
    stampName: string,
    raw: string,
    effects: string[]
  ) => {
    // 先頭の@を除いたものがユーザー名
    const userName = stampName.slice(1)
    const user = store?.getUserByName?.(userName)
    if (!user) {
      return escapeHtml(raw)
    }
    return renderStampDom(
      raw,
      stampName,
      stampName,
      getStampImageUrl(user.iconFileId),
      effects
    )
  }
  const renderNormalStamp = (
    stampName: string,
    raw: string,
    effects: string[]
  ) => {
    const stamp = store?.getStampByName?.(stampName)
    if (!stamp) {
      return escapeHtml(raw)
    }
    return renderStampDom(
      raw,
      stampName,
      stamp.name,
      getStampImageUrl(stamp.fileId),
      effects
    )
  }
  const renderStamp = (raw: string) => {
    const inner = raw.slice(1, -1)
    const hexMatch = hexReg.exec(inner)
    if (hexMatch) {
      return renderHexStamp(hexMatch)
    }
    const hslMatch = hslReg.exec(inner)
    if (hslMatch) {
      return renderHslStamp(hslMatch)
    }
    const [stampName, ...effects] = inner.split('.')
    // ユーザーアイコン
    if (stampName.startsWith('@')) {
      return renderUserStamp(stampName, raw, effects)
    }
    if (!stampReg.exec(stampName)) {
      return escapeHtml(raw)
    }
    // 通常スタンプ
    return renderNormalStamp(stampName, raw, effects)
  }

  return renderStamp
}
