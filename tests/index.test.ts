import { setup } from './setupMd'

describe('index', () => {
  const md = setup()

  it('can render', () => {
    const actual = md.render(`
**po**
:xx:
[message link](https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491)
\`https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68492\`
\`\`\`
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68493
\`\`\`
!!https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68494!!
!!x!!
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68495
`)
    const expected = {
      embeddings: [
        {
          id: 'e97518db-ebb8-450f-9b4a-273234e68495',
          type: 'message'
        }
      ],
      rawText: `
**po**
:xx:
[message link](https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491)
\`https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68492\`
\`\`\`
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68493
\`\`\`
!!https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68494!!
!!x!!
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68495
`,
      renderedText: `<br>
<p><strong>po</strong><br>
:xx:<br>
<a href="https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">message link</a><br>
<code>https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68492</code></p>
<pre class="traq-code traq-lang"><code class="lang-awk">https:<span class="hljs-regexp">//</span>example.com<span class="hljs-regexp">/messages/</span>e97518db-ebb8-<span class="hljs-number">450</span>f-<span class="hljs-number">9</span>b4a-<span class="hljs-number">273234</span>e68493
</code></pre>
<p><span class="spoiler"><a href="https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68494" target="_blank" rel="nofollow noopener noreferrer">https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68494</a></span><br>
<span class="spoiler">x</span><br>
</p>
`
    }
    expect(actual).toStrictEqual(expected)
  })

  it('can render inline (1)', () => {
    const actual = md.renderInline(`
**po**
:xx:
!!x!!
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
`)
    const expected = {
      embeddings: [
        {
          id: 'e97518db-ebb8-450f-9b4a-273234e68491',
          type: 'message'
        }
      ],
      rawText: `
**po**
:xx:
!!x!!
https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
`,
      renderedText: ` po :xx: <span class="spoiler">x</span> `
    }
    expect(actual).toStrictEqual(expected)
  })

  it('can render inline (2)', () => {
    const actual = md.renderInline(`
- a!!aaa
- a!!aa
`)
    const expected = {
      embeddings: [],
      rawText: `
- a!!aaa
- a!!aa
`,
      // FIXME: https://github.com/traPtitech/traq-markdown-it/issues/59
      renderedText: ` - a<span class="spoiler">aaa - a</span>aa `
      //renderedText: ` - a!!aaa - a!!aa `
    }
    expect(actual).toStrictEqual(expected)
  })
  it('can render inline (3)', () => {
    const actual = md.renderInline(`
  !!p
  o!!

  !!
  po
  !!
  `)
    const expected = {
      embeddings: [],
      rawText: `
  !!p
  o!!

  !!
  po
  !!
  `,
      renderedText: ` <span class="spoiler">p o</span>  !! po !! `
    }
    expect(actual).toStrictEqual(expected)
  })
})
