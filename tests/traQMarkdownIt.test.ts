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
        https://example.com/messages/e97518db-ebb8-450f-9b4a-273234e68491
      `,
      renderedText:
        '<strong>po</strong> ' +
        ':xx: ' +
        '<i class="emoji message-emoji " title=":me:" style="background-image: url(/api/v3/files/d7461966-e5d3-4c6d-9538-7c8605f45a1e);">:me:</i> ' +
        '<mark>x</mark> ' +
        '<span class="spoiler">x</span>'
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
  it('can render inline (4)', () => {
    const actual = md.renderInline(dedent`
      aaa
      aa

      aaa



      aa
    `)
    const expected = {
      embeddings: [],
      rawText: dedent`
        aaa
        aa

        aaa



        aa
      `,
      renderedText: `aaa aa aaa  aa`
    }
    expect(actual).toStrictEqual(expected)
  })
  it('can render inline (5)', () => {
    const actual = md.renderInline(dedent`
      $\\KaTeX$
      $\\frac{\\pi}{55555}$
    `)
    const expected = {
      embeddings: [],
      rawText: dedent`
        $\\KaTeX$
        $\\frac{\\pi}{55555}$
      `,
      renderedText:
        '<span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.89883em;vertical-align:-0.2155em;"></span><span class="mord text"><span class="mord textrm">K</span><span class="mspace" style="margin-right:-0.17em;"></span><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.68333em;"><span style="top:-2.904999em;"><span class="pstrut" style="height:2.7em;"></span><span class="mord"><span class="mord textrm mtight sizing reset-size6 size3">A</span></span></span></span></span></span><span class="mspace" style="margin-right:-0.15em;"></span><span class="mord text"><span class="mord textrm">T</span><span class="mspace" style="margin-right:-0.1667em;"></span><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.46782999999999997em;"><span style="top:-2.7845em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord textrm">E</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2155em;"><span></span></span></span></span><span class="mspace" style="margin-right:-0.125em;"></span><span class="mord textrm">X</span></span></span></span></span></span> ' +
        '<span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:1.040392em;vertical-align:-0.345em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.695392em;"><span style="top:-2.6550000000000002em;"><span class="pstrut" style="height:3em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">55555</span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.394em;"><span class="pstrut" style="height:3em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.03588em;">π</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.345em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span></span></span></span>'
    }
    expect(actual).toStrictEqual(expected)
  })
  it('can render inline (6)', () => {
    const actual = md.renderInline(dedent`
      $$
      \\Huge not huge
      \\huge not huge
      \\LARGE not large
      \\Large not large
      \\large not large
      \\rule{500em}{500em}
      $$
    `)
    const expected = {
      embeddings: [],
      rawText: dedent`
        $$
        \\Huge not huge
        \\huge not huge
        \\LARGE not large
        \\Large not large
        \\large not large
        \\rule{500em}{500em}
        $$
      `,
      renderedText:
        '<span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:1.19444em;vertical-align:-0.19444em;"></span>' +
        '<span class="mord mathnormal">n</span><span class="mord mathnormal">o</span><span class="mord mathnormal">t</span><span class="mord mathnormal">h</span><span class="mord mathnormal" style="margin-right:0.03588em;">ug</span><span class="mord mathnormal">e</span>' +
        '<span class="mord mathnormal">n</span><span class="mord mathnormal">o</span><span class="mord mathnormal">t</span><span class="mord mathnormal">h</span><span class="mord mathnormal" style="margin-right:0.03588em;">ug</span><span class="mord mathnormal">e</span>' +
        '<span class="mord mathnormal">n</span><span class="mord mathnormal">o</span><span class="mord mathnormal" style="margin-right:0.01968em;">tl</span><span class="mord mathnormal">a</span><span class="mord mathnormal" style="margin-right:0.02778em;">r</span><span class="mord mathnormal" style="margin-right:0.03588em;">g</span><span class="mord mathnormal">e</span>' +
        '<span class="mord mathnormal">n</span><span class="mord mathnormal">o</span><span class="mord mathnormal" style="margin-right:0.01968em;">tl</span><span class="mord mathnormal">a</span><span class="mord mathnormal" style="margin-right:0.02778em;">r</span><span class="mord mathnormal" style="margin-right:0.03588em;">g</span><span class="mord mathnormal">e</span>' +
        '<span class="mord mathnormal">n</span><span class="mord mathnormal">o</span><span class="mord mathnormal" style="margin-right:0.01968em;">tl</span><span class="mord mathnormal">a</span><span class="mord mathnormal" style="margin-right:0.02778em;">r</span><span class="mord mathnormal" style="margin-right:0.03588em;">g</span><span class="mord mathnormal">e</span>' +
        '<span class="mord rule" style="border-right-width:1em;border-top-width:1em;bottom:0em;"></span>' +
        '</span></span></span>'
    }
    expect(actual).toStrictEqual(expected)
  })
  it('can render inline (7)', () => {
    const actual = md.renderInline(dedent`
      $$
      \\KaTeX
      $$
    `)
    const expected = {
      embeddings: [],
      rawText: dedent`
        $$
        \\KaTeX
        $$
      `,
      renderedText:
        '<span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.89883em;vertical-align:-0.2155em;"></span><span class="mord text"><span class="mord textrm">K</span><span class="mspace" style="margin-right:-0.17em;"></span><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.68333em;"><span style="top:-2.904999em;"><span class="pstrut" style="height:2.7em;"></span><span class="mord"><span class="mord textrm mtight sizing reset-size6 size3">A</span></span></span></span></span></span><span class="mspace" style="margin-right:-0.15em;"></span><span class="mord text"><span class="mord textrm">T</span><span class="mspace" style="margin-right:-0.1667em;"></span><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.46782999999999997em;"><span style="top:-2.7845em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord textrm">E</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2155em;"><span></span></span></span></span><span class="mspace" style="margin-right:-0.125em;"></span><span class="mord textrm">X</span></span></span></span></span></span>'
    }
    expect(actual).toStrictEqual(expected)
  })
})
