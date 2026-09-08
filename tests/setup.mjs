import { readFile } from 'node:fs/promises'
import { after } from 'node:test'
import { createRuntime, presets } from '@traq-markdown-parser/traq'

export const wasmBytes = await readFile(
  new URL(import.meta.resolve('@traq-markdown-parser/traq/parser.wasm'))
)
const runtime = await createRuntime(wasmBytes)
export const parser = runtime.createParser(presets.traq.v1)
export const commonParser = () => runtime.createParser(presets.commonmark)

after(() => runtime.dispose())
