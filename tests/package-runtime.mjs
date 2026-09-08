import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createParser, presets } from '@traq-markdown-parser/ts'
import { renderer, PresetBuilder } from '@traptitech/traq-markdown-it'
import { plugin } from '@traptitech/traq-markdown-it/commonmark'
import { v1 } from '@traptitech/traq-markdown-it/traq'

const css = await readFile(
  new URL(import.meta.resolve('@traptitech/traq-markdown-it/index.css')),
  'utf8'
)
assert(css.includes('.markdown-body') && css.includes('.emoji'))
const parser = await createParser(
  await readFile(
    new URL(import.meta.resolve('@traq-markdown-parser/ts/parser.wasm'))
  ),
  presets.traq.v1
)
try {
  const document = parser.parse('**package** $x$ !!hidden!! :0xff0000:')
  const output = renderer(v1.html()).render(document)
  for (const text of [
    '<strong>package</strong>',
    'katex',
    'spoiler',
    'background-color: #ff0000'
  ])
    assert(output.includes(text), text)
  const custom = renderer(new PresetBuilder().add(plugin()).build())
  assert.equal(
    custom.renderInline(parser.parseInline('**shared declaration**')),
    '<strong>shared declaration</strong>'
  )
} finally {
  parser.dispose()
}
console.log(
  'Two packed packages: declarations, HTML, CSS, and Wasm integration passed'
)
