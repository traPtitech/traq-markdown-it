import { readFile } from 'node:fs/promises'
import { after } from 'node:test'
import { loadRuntime } from '@traq-markdown-parser/ts'

export const runtime = await loadRuntime(
  await readFile(
    new URL(import.meta.resolve('@traq-markdown-parser/ts/parser.wasm'))
  )
)
export const parser = runtime.parser(runtime.presets.traq.v1)
after(() => {
  parser.dispose()
  runtime.dispose()
})
