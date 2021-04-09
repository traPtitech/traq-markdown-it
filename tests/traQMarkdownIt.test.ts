import { setup } from './setupMd'
import dedent from 'ts-dedent'

describe('index', () => {
  const md = setup()

  it('can render', () => {
    const actual = md.render(
      dedent(`
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
    )
    const expected = {
      embeddings: [
        {
          id: 'e97518db-ebb8-450f-9b4a-273234e68491',
          type: 'message'
        },
        {
          id: 'e97518db-ebb8-450f-9b4a-273234e68495',
          type: 'message'
        }
      ],
      rawText: dedent(`
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
      `),
      renderedText: dedent`
        <p><strong>po</strong><br>
        :xx:<br>
        <a href="https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491" target="_blank" rel="nofollow noopener noreferrer">message link</a><br>
        <code>https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68492</code></p>
        <pre class="traq-code traq-lang"><code class="lang-awk">https:<span class="hljs-regexp">//</span>example.com<span class="hljs-regexp">/messages/</span>e97518db-ebb8-<span class="hljs-number">450</span>f-<span class="hljs-number">9</span>b4a-<span class="hljs-number">273234</span>e68493
        </code></pre>
        <p><span class="spoiler"><a href="https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68494" target="_blank" rel="nofollow noopener noreferrer">https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68494</a></span><br>
        <span class="spoiler">x</span></p>

      `
    }
    expect(actual).toStrictEqual(expected)
  })

  it('can render inline (1)', () => {
    const actual = md.renderInline(dedent`
      **po**
      :xx:
      :me:
      ==x==
      !!x!!
      $\\KaTeX$
      $$
      \\KaTeX
      $$
      https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
    `)
    const expected = {
      embeddings: [
        {
          id: 'e97518db-ebb8-450f-9b4a-273234e68491',
          type: 'message'
        }
      ],
      rawText: dedent`
        **po**
        :xx:
        :me:
        ==x==
        !!x!!
        $\\KaTeX$
        $$
        \\KaTeX
        $$
        https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
      `,
      renderedText:
        '<strong>po</strong> ' +
        ':xx: ' +
        '<i class="emoji message-emoji " title=":me:" style="background-image: url(/api/v3/files/d7461966-e5d3-4c6d-9538-7c8605f45a1e);">:me:</i> ' +
        '<mark>x</mark> ' +
        '<span class="spoiler">x</span> ' +
        '$\\KaTeX$' +
        '$$\\KaTeX$$'
    }
    expect(actual).toStrictEqual(expected)
  })

  it('can render inline (2)', () => {
    const actual = md.renderInline(dedent`
      - a!!aaa
      - a!!aa
    `)
    const expected = {
      embeddings: [],
      rawText: dedent`
        - a!!aaa
        - a!!aa
      `,
      renderedText: `- a!!aaa - a!!aa`
    }
    expect(actual).toStrictEqual(expected)
  })
  it('can render inline (3)', () => {
    const actual = md.renderInline(dedent`
      !!p
      o!!

      !!
      po
      !!
    `)
    const expected = {
      embeddings: [],
      rawText: dedent`
        !!p
        o!!

        !!
        po
        !!
      `,
      renderedText: `<span class="spoiler">p o</span> !! po !!`
    }
    expect(actual).toStrictEqual(expected)
  })
})
