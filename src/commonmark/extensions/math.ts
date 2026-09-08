import katex from 'katex'
import { escapeHtml } from '../../core/html.js'

export function math(tex: string, displayMode: boolean) {
  try {
    const html = katex.renderToString(tex, {
      displayMode,
      output: 'html',
      maxSize: 100,
      strict: code => (code === 'unicodeTextInMathMode' ? 'ignore' : 'warn')
    })
    return displayMode ? `<p class="katex-block is-scroll">${html}</p>\n` : html
  } catch (error) {
    if (!(error instanceof katex.ParseError)) throw error
    const tag = displayMode ? 'p' : 'span'
    const classes = displayMode
      ? 'katex-block katex-error is-scroll'
      : 'katex-error'
    return (
      `<${tag} class="${classes}" title="${escapeHtml(String(error))}">${escapeHtml(tex)}</${tag}>` +
      (displayMode ? '\n' : '')
    )
  }
}
