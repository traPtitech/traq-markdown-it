import test from 'node:test'
import assert from 'node:assert/strict'
import { renderer } from '@traptitech/traq-markdown-it'
import { v1 } from '@traptitech/traq-markdown-it/traq'
import { parser, runtime } from './setup.mjs'

test('traQ presentation combines tables, marks, spoilers, math, and highlighted code', () => {
  const view = renderer(v1.html())
  const source =
    '| left | right |\n| :--- | ---: |\n| **a** | b |\n\n==mark== ~~strike~~ !!secret!! $x$\n\n```js:caption\nconst x = 1\n```'
  const html = view.render(parser.parse(source))
  for (const expected of [
    '<table>',
    'text-align:left',
    'text-align:right',
    '<strong>a</strong>',
    '<mark>mark</mark>',
    '<s>strike</s>',
    'class="spoiler"',
    'class="katex"',
    'traq-code traq-lang',
    '<cite>caption</cite>',
    'hljs-keyword'
  ])
    assert(html.includes(expected), expected)
  assert.match(view.render(parser.parse('one\ntwo')), /one<br>\ntwo/)
  assert.match(
    view.renderInline(parser.parseInline('$\\invalidcommand$')),
    /katex-error/
  )
})

test('stamp stores are isolated and unrecognized effects preserve escaped source', () => {
  const make = origin =>
    renderer(
      v1.html({
        store: {
          getStampByName: name =>
            name === 'wave' ? { name, fileId: 'stamp' } : undefined,
          getUserByName: name =>
            name === 'alice' ? { iconFileId: 'icon' } : undefined,
          generateStampHref: id => origin + '/' + id
        }
      })
    )
  const first = make('https://first.example'),
    second = make('https://second.example')
  const document = parser.parseInline(':wave: :@alice: :0xff0000: :wave.spin:')
  assert.match(first.renderInline(document), /first\.example\/stamp/)
  assert.match(second.renderInline(document), /second\.example\/icon/)
  assert.doesNotMatch(first.renderInline(document), /second\.example/)
  assert.match(first.renderInline(document), /background-color: #ff0000/)
  assert.equal(
    first.renderInline(parser.parseInline(':wave.unknown:')),
    ':wave.unknown:'
  )
  assert.equal(first.renderInline(parser.parseInline(':missing:')), ':missing:')
  const unsafe = renderer(
    v1.html({
      store: {
        getStampByName: () => ({ name: 'wave', fileId: 'id' }),
        generateStampHref: () => 'javascript:alert(1)'
      }
    })
  )
  assert.equal(unsafe.renderInline(parser.parseInline(':wave:')), ':wave:')
})

test('reference highlighting and link/image policies belong to each renderer', t => {
  const common = runtime.parser(runtime.presets.commonmark)
  t.after(() => common.dispose())
  const view = renderer(
    v1.html({
      store: {
        getMe: () => ({ id: 'me' }),
        getUserGroup: () => ({ members: [{ id: 'me' }] }),
        generateUserHref: id => '#user-' + id,
        generateUserGroupHref: id => '#group-' + id,
        generateChannelHref: id => '#channel-' + id
      }
    })
  )
  const source =
    '!{"type":"user","id":"me","raw":"@me"} !{"type":"group","id":"g","raw":"@group"} !{"type":"channel","id":"c","raw":"#channel"}'
  const html = view.renderInline(parser.parseInline(source))
  assert.match(html, /message-user-link-highlight/)
  assert.match(html, /message-group-link-highlight/)
  assert.match(html, /href="#channel-c"/)
  assert.doesNotMatch(
    view.renderInline(
      common.parseInline('![x](https://unlisted.example/x.png)')
    ),
    /<img/
  )
  assert.match(
    view.renderInline(common.parseInline('![x](https://trap.jp/x.png)')),
    /<img/
  )
  const custom = renderer(
    v1.html({ validateImage: () => true, validateLink: () => false })
  )
  assert.match(
    custom.renderInline(
      common.parseInline('![x](https://unlisted.example/x.png)')
    ),
    /<img/
  )
  assert.equal(
    custom.renderInline(parser.parseInline('[x](https://example.com)')),
    'x'
  )
})

test('table handlers reject forged row and cell payloads', () => {
  const view = renderer(v1.html())
  const document = parser.parse('| a |\n| - |\n| b |')
  const cell = document.children[0].children[0].children[0]
  cell.data.alignment = 'left;position:fixed'
  assert.throws(() => view.render(document), /Invalid table cell/)
})
