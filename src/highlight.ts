import hljs from 'highlight.js'
import { escapeHtml } from './util'

const noHighlightRe = /^(no-?highlight|plain|text)$/i

export const highlight = (code: string, lang: string): string => {
  const [langName, langCaption] = lang.split(':')
  const citeTag = langCaption ? `<cite>${langCaption}</cite>` : ''

  if (hljs.getLanguage(langName)) {
    const result = hljs.highlight(langName, code)
    return `<pre class="traq-code traq-lang">${citeTag}<code class="lang-${result.language}">${result.value}</code></pre>`
  } else if (noHighlightRe.test(langName)) {
    return `<pre class="traq-code traq-lang">${citeTag}<code>${escapeHtml(
      code
    )}</code></pre>`
  } else {
    const result = hljs.highlightAuto(code)
    return `<pre class="traq-code traq-lang">${citeTag}<code class="lang-${result.language}">${result.value}</code></pre>`
  }
}
