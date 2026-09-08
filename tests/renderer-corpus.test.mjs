import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { renderer } from '@traptitech/traq-markdown-it'
import { v1 } from '@traptitech/traq-markdown-it/traq'
import { parser } from './setup.mjs'

const fixtures = JSON.parse(
  await readFile(
    new URL('./fixtures/renderer-corpus-regressions.json', import.meta.url),
    'utf8'
  )
)
const view = renderer(v1.html())
for (const { name, markdown, html } of fixtures)
  test('corpus regression: ' + name, () => {
    assert.equal(view.render(parser.parse(markdown)), html)
  })
