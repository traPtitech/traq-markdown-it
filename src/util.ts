const htmlReplaceRe = /[&<>"]/g
const htmlReplaceMap = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;']
])

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const replaceHtmlChar = (ch: string): string => htmlReplaceMap.get(ch)!

export const escapeHtml = (html: string): string => {
  if (htmlReplaceRe.test(html)) {
    return html.replace(htmlReplaceRe, replaceHtmlChar)
  }
  return html
}
