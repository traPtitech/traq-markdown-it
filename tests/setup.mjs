import { readFile } from 'node:fs/promises'
import { after } from 'node:test'
import { createParser, presets } from '@traq-markdown-parser/ts'
export const wasmBytes = await readFile(
  new URL(import.meta.resolve('@traq-markdown-parser/ts/parser.wasm'))
)
export const parser = await createParser(wasmBytes, presets.traq.v1)
export const commonParser = () => createParser(wasmBytes, presets.commonmark)
after(() => parser.dispose())
