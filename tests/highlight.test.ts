import { createHighlightFunc } from '#/highlight'
import hljs from 'highlight.js'

describe('highlight', () => {
  const code = 'console.log("po")'
  const code2 = `
    body {
      height: 100%;
      width: 100%;
    }
  `

  const highlightFunc = createHighlightFunc('class1', false)
  const highlightFuncCaption = createHighlightFunc('class1', true)

  it('can output without caption', () => {
    const actual = highlightFunc(code, 'js')
    const expected = `<pre class="class1"><code class="lang-js">${
      hljs.highlight('js', code).value
    }</code></pre>`
    expect(actual).toBe(expected)
  })
  it('can output with caption', () => {
    const actual = highlightFuncCaption(code, 'js:main.js')
    const expected = `<pre class="class1"><cite>main.js</cite><code class="lang-js">${
      hljs.highlight('js', code).value
    }</code></pre>`
    expect(actual).toBe(expected)
  })
  it('can output with caption escaped', () => {
    const actual = highlightFuncCaption(
      code,
      'js:<script>console.log("po")</script>'
    )
    const expected =
      '<pre class="class1">' +
      '<cite>&lt;script&gt;console.log(&quot;po&quot;)&lt;/script&gt;</cite>' +
      `<code class="lang-js">${hljs.highlight('js', code).value}</code></pre>`
    expect(actual).toBe(expected)
  })
  it('can output plaintext', () => {
    const actual = highlightFunc(code, 'plain')
    const expected = `<pre class="class1"><code>console.log(&quot;po&quot;)</code></pre>`
    expect(actual).toBe(expected)
  })
  it('can output with auto detect', () => {
    const actual = highlightFunc(code2, '')
    const expected = `<pre class="class1"><code class="lang-css">${
      hljs.highlightAuto(code2).value
    }</code></pre>`
    expect(actual).toBe(expected)
  })
})
