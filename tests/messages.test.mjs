import test from 'node:test'
import assert from 'node:assert/strict'
import {
  messageRenderer,
  embeddingFromUrl
} from '@traptitech/traq-markdown-it/traq/v1'
import { parser, commonParser } from './setup.mjs'
const origin = 'https://q.example.test',
  fileId = '00000000-0000-0000-0000-000000000001',
  messageId = '00000000-0000-0000-0000-000000000002'
const file = origin + '/files/' + fileId,
  quote = origin + '/messages/' + messageId
const view = messageRenderer({ origin })

test('message rendering extracts cards, trims trailing bare links, and keeps the AST reusable', () => {
  const source = '本文\n' + file + '\n' + quote,
    document = parser.parse(source),
    snapshot = structuredClone(document)
  const normal = view.render(document),
    preview = view.renderInline(document)
  assert.equal(normal.renderedText, '<p>本文</p>\n')
  assert.equal(preview.renderedText, '本文')
  assert.equal(normal.rawText, source)
  assert.deepEqual(normal.embeddings, [
    { type: 'file', id: fileId },
    { type: 'message', id: messageId }
  ])
  assert.deepEqual(preview.embeddings, normal.embeddings)
  assert.deepEqual(document, snapshot)
  assert.equal(view.render(document).renderedText, normal.renderedText)
  assert.equal(
    view
      .render(parser.parse(file + '\n\n' + quote))
      .renderedText.includes(file),
    true
  )
})

test('card extraction respects Markdown context and preserves external URL candidates', () => {
  const source =
    file +
    ' mid ' +
    file +
    '\n[quoted](' +
    quote +
    ')\n!!' +
    quote +
    '!!\n`' +
    quote +
    '`\nhttps://example.com\nhttps://example.com'
  assert.deepEqual(view.render(parser.parse(source)).embeddings, [
    { type: 'file', id: fileId },
    { type: 'message', id: messageId },
    { type: 'url', url: 'https://example.com' },
    { type: 'url', url: 'https://example.com' }
  ])
  for (const source of [
    '!!' + file + '!!',
    '`' + file + '`',
    '```\n' + file + '\n```'
  ])
    assert.deepEqual(view.render(parser.parse(source)).embeddings, [])
  assert.equal(embeddingFromUrl(origin + '/channels/test', origin), undefined)
  assert.equal(embeddingFromUrl(origin + '/files/invalid', origin), undefined)
  assert.equal(embeddingFromUrl('javascript:alert(1)', origin), undefined)
  assert.equal(embeddingFromUrl('/files/' + fileId, origin), undefined)
  assert.deepEqual(embeddingFromUrl(file + '?download=1', origin), {
    type: 'file',
    id: fileId
  })
  assert.deepEqual(
    embeddingFromUrl('https://other.test/files/' + fileId, origin),
    { type: 'url', url: 'https://other.test/files/' + fileId }
  )
})

test('preview labels retained card links without removing explicit labels from message content', () => {
  const document = parser.parse('[資料](' + file + ') ' + quote + ' 続き')
  assert.match(view.render(document).renderedText, />資料<\/a>/)
  const text = view.renderInline(document).renderedText
  assert.match(text, />\[\[添付ファイル\]\]<\/a>/)
  assert.match(text, />\[\[引用メッセージ\]\]<\/a> 続き/)
  assert.equal(view.renderInline(parser.parse(file)).renderedText, '')
  assert.match(view.render(parser.parse('<' + file + '>')).renderedText, /<a /)
})

test('preview preserves explicit quote links and their labels', () => {
  for (const source of [
    '[AAA](' + quote + ')',
    '[**AAA**](' + quote + ')',
    '[AAA][quote]\n\n[quote]: ' + quote,
    '<' + quote + '>'
  ]) {
    const document = parser.parse(source),
      result = view.renderInline(document)
    assert.match(result.renderedText, /<a /)
    assert.doesNotMatch(result.renderedText, /\[\[引用メッセージ\]\]/)
    assert.equal(
      result.renderedText,
      view.render(document).renderedText.trim().slice(3, -4)
    )
    assert.deepEqual(result.embeddings, [{ type: 'message', id: messageId }])
  }
})

test('traQ preview flattens full-document block structure and break nodes', () => {
  assert.equal(
    view.renderInline({
      source: '<unknown>',
      children: [{ kind: 'custom', span: { start: 0, end: 9 }, data: {} }]
    }).renderedText,
    '&lt;unknown&gt;'
  )
  for (const [source, expected] of [
    ['a\nb', 'a b'],
    ['a  \nb', 'a b'],
    ['a\n\nb', 'a b'],
    ['# heading\n\ntext', '# heading text'],
    ['- one\n- two', '- one - two'],
    ['> quote\n> next', '> quote next'],
    ['| a | b |\n| - | - |\n| c | d |', '| a | b | | c | d |'],
    ['```\na\nb\n```', '<code>a\nb\n</code>']
  ])
    assert.equal(
      view.renderInline(parser.parse(source)).renderedText,
      expected,
      source
    )
  assert.match(view.render(parser.parse('a\nb')).renderedText, /<br>/)
  assert.doesNotMatch(
    view.renderInline(parser.parse('a\n\n\n\nb')).renderedText,
    /<br>/
  )
})

test('preview renders images as links and restricts math size commands', t => {
  const images = commonParser()
  t.after(() => images.dispose())
  assert.equal(
    view.renderInline(images.parse('![alt](https://example.test/a.png)'))
      .renderedText,
    '<a href="https://example.test/a.png" data-is-image>alt</a>'
  )
  assert.doesNotMatch(
    view.renderInline(parser.parse('$\\Huge x$')).renderedText,
    /size11|katex-display/
  )
  assert.doesNotMatch(
    view.renderInline(parser.parse('$$x$$')).renderedText,
    /katex-block|katex-display/
  )
  assert.match(view.render(parser.parse('$$x$$')).renderedText, /katex-block/)
})
