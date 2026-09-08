import { readFile } from 'node:fs/promises'
import { createParser, presets } from '@traq-markdown-parser/ts'
import { renderer } from '@traptitech/traq-markdown-it'
import { v1 } from '@traptitech/traq-markdown-it/traq'

const parser = await createParser(
  await readFile(
    new URL(import.meta.resolve('@traq-markdown-parser/ts/parser.wasm'))
  ),
  presets.traq.v1
)
try {
  const view = renderer(v1.html())
  console.log(
    view.render(
      parser.parse('**Hello** ==Markdown== $x^2$ !!secret!! :0xff0000:')
    )
  )
} finally {
  parser.dispose()
}
