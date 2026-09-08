import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import MarkdownIt from 'markdown-it'
import { escapeHtml } from 'markdown-it/lib/common/utils.mjs'
import { renderer } from '@traptitech/traq-markdown-it'
import { preset } from '@traptitech/traq-markdown-it/commonmark'
import { commonParser } from './setup.mjs'
const fixtures = JSON.parse(
  await readFile(
    new URL('./fixtures/commonmark-0.31.2.json', import.meta.url),
    'utf8'
  )
)

test('CommonMark fixture inputs match markdown-it with the same escaped-HTML policy', () => {
  const parser = commonParser()
  const view = renderer(
    preset({ validateLink: () => true, validateImage: () => true })
  )
  const expected = new MarkdownIt('commonmark', { html: true, xhtmlOut: false })
  expected.validateLink = () => true
  expected.renderer.rules.html_inline = (tokens, index) =>
    escapeHtml(tokens[index].content)
  expected.renderer.rules.html_block = (tokens, index) =>
    '<p>' + escapeHtml(tokens[index].content) + '</p>\n'
  try {
    for (const entry of fixtures)
      assert.equal(
        view.render(parser.parse(entry.markdown)),
        expected.render(entry.markdown),
        `example ${entry.example}: ${entry.section}`
      )
  } finally {
    parser.dispose()
  }
})
