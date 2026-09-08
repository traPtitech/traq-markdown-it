import hljs from 'highlight.js'
import defaultSubset from './languages.js'
import { escapeHtml } from '../core/html.js'

const noHighlightRe = /^(no-?highlight|plain|text)$/i

export const createHighlightFunc =
  (preClass: string, withCaption = true, useSubsetForAuto = true) =>
  (code: string, lang: string) => {
    let langName
    let citeTag = ''

    if (withCaption) {
      const [_langName, langCaption] = lang.split(':')
      langName = _langName ?? ''
      if (langCaption) {
        citeTag = `<cite>${escapeHtml(langCaption)}</cite>`
      }
    } else {
      langName = lang
    }

    if (hljs.getLanguage(langName)) {
      const result = hljs.highlight(code, { language: langName })
      return `<pre class="${preClass}">${citeTag}<code class="lang-${result.language}">${result.value}</code></pre>`
    } else if (noHighlightRe.test(langName)) {
      return `<pre class="${preClass}">${citeTag}<code>${escapeHtml(code)}</code></pre>`
    } else {
      const result = hljs.highlightAuto(
        code,
        useSubsetForAuto ? defaultSubset : undefined
      )
      return `<pre class="${preClass}">${citeTag}<code class="lang-${result.language}">${result.value}</code></pre>`
    }
  }
