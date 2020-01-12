"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const markdown_it_regexp_1 = __importDefault(require("markdown-it-regexp"));
const util_1 = require("./util");
let store;
let baseUrl = '';
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
]);
const sizeEffectSet = new Set(['ex-large', 'large', 'small']);
const animeEffectAliasMap = new Map([
    ['marquee', 'conga'],
    ['marquee-inv', 'conga-inv']
]);
const maxEffectCount = 5;
const wrapWithEffect = (stampHtml, animeEffects, sizeEffect) => {
    const filterOpenTag = animeEffects
        .map((e, i) => `<span class="emoji-effect ${e}${i == 0 && sizeEffect ? ` ${sizeEffect}` : ''}">`)
        .join('');
    const filterCloseTag = '</span>'.repeat(animeEffects.length);
    return filterOpenTag + stampHtml + filterCloseTag;
};
const renderStampDomWithStyle = (rawMatch, stampName, imgTitle, style, effects) => {
    const escapedTitle = util_1.escapeHtml(imgTitle);
    const escapedStyle = util_1.escapeHtml(style);
    const escapedName = util_1.escapeHtml(stampName);
    const sizeEffects = effects.filter(e => sizeEffectSet.has(e));
    const animeEffects = effects.filter(e => animeEffectSet.has(e));
    // 知らないエフェクトはダメ
    if (sizeEffects.length + animeEffects.length < effects.length) {
        return rawMatch;
    }
    // アニメーション系エフェクトは5つまで
    if (animeEffects.length > maxEffectCount) {
        return rawMatch;
    }
    // aliasの置き換え
    const replacedAnimeEffects = animeEffects.map(e => 
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    animeEffectAliasMap.has(e) ? animeEffectAliasMap.get(e) : e);
    // 複数サイズ指定が合った場合は最後のものを適用
    const sizeEffectClass = sizeEffects[sizeEffects.length - 1] || '';
    const stampHtml = `<i class="emoji s24 message-emoji ${sizeEffectClass}" title=":${escapedTitle}:" style="${escapedStyle};">:${escapedName}:</i>`;
    return wrapWithEffect(stampHtml, replacedAnimeEffects, sizeEffectClass);
};
const renderStampDom = (rawMatch, stampName, imgTitle, imgUrl, effects) => renderStampDomWithStyle(rawMatch, stampName, imgTitle, `background-image: url(${imgUrl})`, effects);
const stampReg = /[a-zA-Z0-9+_-]{1,32}/;
const hslReg = /(hsl\(\d+,\s*[\d]+(?:\.[\d]+)?%,\s*[\d]+(?:\.[\d]+)?%\))(.*)/;
const hexReg = /0x([0-9a-f]{6})(.*)/;
const renderHslStamp = (match) => {
    // HSL: hsl(..., ...%, ...%)
    const effects = match[2] === '' ? [] : match[2].split('.').slice(1);
    return renderStampDomWithStyle(`:${match[0]}:`, match[1], match[1], `background-color: ${match[1]}`, effects);
};
const renderHexStamp = (match) => {
    // Hex: 0x......
    const effects = match[2] === '' ? [] : match[2].split('.').slice(1);
    return renderStampDomWithStyle(`:${match[0]}:`, `0x${match[1]}`, `0x${match[1]}`, `background-color: #${match[1]}`, effects);
};
exports.renderStamp = (match) => {
    // match[1] は:を除いた部分
    const hexMatch = hexReg.exec(match[1]);
    if (hexMatch) {
        return renderHexStamp(hexMatch);
    }
    const hslMatch = hslReg.exec(match[1]);
    if (hslMatch) {
        return renderHslStamp(hslMatch);
    }
    if (!stampReg.exec(match[1])) {
        return match[0];
    }
    const splitted = match[1].split('.');
    const stampName = splitted[0];
    const effects = splitted.length > 1 ? splitted.slice(1) : [];
    if (store.getStampFromName(stampName)) {
        // 通常スタンプ
        return renderStampDom(match[0], stampName, store.getStampFromName(stampName).name, `${baseUrl}/api/1.0/files/${store.getStampFromName(stampName).fileId}`, effects);
    }
    else if (store.getUserByName(stampName)) {
        // ユーザーアイコン
        const user = store.getUserByName(stampName);
        return renderStampDom(match[0], stampName, stampName, `${baseUrl}/api/1.0/files/${user.iconFileId}`, effects);
    }
    return match[0];
};
function stampPlugin(md, _store, _baseUrl) {
    store = _store;
    if (_baseUrl) {
        baseUrl = _baseUrl;
    }
    markdown_it_regexp_1.default(/:((?:[a-zA-Z0-9+_-]{1,32}|\w+\([^:<>"'=+!?]+\))[\w+-.]*):/, exports.renderStamp)(md);
}
exports.default = stampPlugin;
