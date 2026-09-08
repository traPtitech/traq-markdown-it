import test from 'node:test'
import assert from 'node:assert/strict'
import MarkdownIt from 'markdown-it'
import { Plugin as Declaration } from '@traptitech/traq-markdown-it/definitions'
import * as commonNodes from '@traq-markdown-parser/traq/commonmark/nodes'
import * as html from '@traptitech/traq-markdown-it'
import * as common from '@traptitech/traq-markdown-it/commonmark'
import * as generic from '@traptitech/traq-markdown-it/generic'
import * as trap from '@traptitech/traq-markdown-it/trap'
import * as trapNodes from '@traq-markdown-parser/traq/trap/nodes'
import * as traq from '@traptitech/traq-markdown-it/traq'
import { commonParser, parser } from './setup.mjs'

const build = plugin => new html.PresetBuilder().add(plugin).build()

test('rendering returns HTML and exposes no parser or token adapter', () => {
  const view = html.renderer(common.preset())
  assert.equal(
    view.render(parser.parse('**bold**')),
    '<p><strong>bold</strong></p>\n'
  )
  assert.equal(
    view.renderInline(parser.parseInline('**bold**')),
    '<strong>bold</strong>'
  )
  assert.deepEqual(Object.keys(view).sort(), ['render', 'renderInline'])
  assert.equal(html.installParser, undefined)
  assert.equal(html.traQMarkdownIt, undefined)
})

test('replacement preserves defaults and earlier snapshots', () => {
  const document = parser.parse('**bold** [link](https://example.com)')
  const plugin = common.html.plugin()
  const builder = new html.PresetBuilder().add(plugin)
  const before = html.renderer(builder.build())
  plugin.replace(common.nodes.Link, (node, ctx) => ctx.inline(node.children))
  assert.throws(() => builder.remove(plugin), /Missing plugin/)
  const custom = html.renderer(build(plugin))
  assert.match(custom.render(document), /<strong>bold<\/strong>/)
  assert.doesNotMatch(custom.render(document), /<a /)
  assert.match(before.render(document), /<a /)
  assert.match(html.renderer(builder.build()).render(document), /<a /)
  assert.throws(() => plugin.replace('typo', () => ''), /Missing handler/)
  assert.throws(
    () => plugin.on(common.nodes.Link, () => ''),
    /Duplicate handler/
  )
})

test('renderer declarations customize Rust-produced nodes', () => {
  const declaration = Declaration.group('custom').new('math')
  const presentation = new html.Plugin(declaration).on(
    'markdown_generic_contracts::math::InlineMathData',
    (node, ctx) => ctx.fallback(node)
  )
  const view = html.renderer(
    new html.PresetBuilder().add(common.plugin()).add(presentation).build()
  )
  assert.equal(view.render(parser.parse('$x$')), '<p>$x$</p>\n')
})

test('composition validates selected names without changing earlier presets', () => {
  const group = Declaration.group('custom')
  const first = new html.Plugin(group.new('one')).on('a', () => '')
  const builder = new html.PresetBuilder().add(first)
  const preset = builder.build()
  assert.throws(() => builder.add(first), /Duplicate plugin/)
  assert.throws(
    () => builder.add(new html.Plugin(group.new('two')).on('a', () => '')),
    /Duplicate handler/
  )
  builder.remove(first)
  assert.doesNotThrow(() => html.renderer(preset))
  assert.throws(() => builder.remove(first), /Missing plugin/)
  builder.add(first).add(new html.Plugin(group.new('one')))
  assert.throws(() => builder.build(), /Duplicate name/)
  const other = Declaration.group('custom')
  assert.throws(
    () =>
      new html.PresetBuilder()
        .add(first)
        .add(new html.Plugin(other.new('different')))
        .build(),
    /Duplicate name/
  )
  assert.throws(() => html.renderer({}), /Expected renderer Preset/)
  assert.throws(() => new html.Plugin('name'), /declaration/)
})

test('custom HTML handlers receive escaped text helpers and rendered children', () => {
  const plugin = common.plugin()
  plugin.replace(
    common.nodes.Strong,
    (node, context) =>
      '<b title="' +
      context.escape('"<&') +
      '">' +
      context.inline(node.children) +
      '</b>'
  )
  const view = html.renderer(build(plugin))
  assert.equal(
    view.renderInline(parser.parseInline('**<x>**')),
    '<b title="&quot;&lt;&amp;">&lt;x&gt;</b>'
  )
  plugin.replace(common.nodes.Strong, () => [])
  assert.throws(
    () => html.renderer(build(plugin)).render(parser.parse('**x**')),
    /HTML strings/
  )
})

test('fallback replacement keeps other extensions and does not require a store', () => {
  const extension = trap.plugin()
  extension.replace(trapNodes.names.Stamp, (node, ctx) => ctx.fallback(node))
  const view = html.renderer(
    new html.PresetBuilder()
      .add(common.plugin())
      .add(generic.plugin())
      .add(extension)
      .build()
  )
  assert.equal(
    view.render(parser.parse(':stamp: ==marked==')),
    '<p>:stamp: <mark>marked</mark></p>\n'
  )
  const source = '!{"type":"user","id":"u","raw":"@user"}'
  assert.equal(
    html.renderer(traq.v1.html()).render(parser.parse(source)),
    '<p>@user</p>\n'
  )
})

test('empty presets escape source without implicitly enabling CommonMark', () => {
  const view = html.renderer(new html.PresetBuilder().build())
  assert.equal(view.render(parser.parse('**bold**')), '<p>**bold**</p>\n')
  const source = '<script>日本語</script>'
  const document = {
    source,
    children: [
      {
        kind: 'unknown',
        data: {},
        span: { start: 0, end: new TextEncoder().encode(source).length }
      }
    ]
  }
  assert.equal(
    view.render(document),
    '<p>&lt;script&gt;日本語&lt;/script&gt;</p>\n'
  )
})

test('tight lists preserve paragraphs owned by blockquotes and nested loose lists', () => {
  const md = new MarkdownIt()
  const local = commonParser()
  try {
    const view = html.renderer(common.preset())
    for (const source of [
      '- one\n- two',
      '- one\n\n- two',
      '- outer\n  - inner\n\n  - loose',
      '- outer\n  > quote',
      '1. parent\n   - child\n     > quote',
      '- **strong**\n\n  paragraph'
    ]) {
      assert.equal(view.render(local.parse(source)), md.render(source), source)
    }
  } finally {
    local.dispose()
  }
})

test('CommonMark owns link policy and rejects malformed known payloads', () => {
  const view = html.renderer(common.preset({ validateLink: () => false }))
  assert.doesNotMatch(
    view.render(parser.parse('[link](https://example.com)')),
    /href=/
  )
  assert.doesNotMatch(
    view.renderInline(parser.parseInline('[link](https://example.com)')),
    /href=/
  )
  const document = parser.parseInline('[label](https://example.com)')
  document.children[0].data.destination = 'javascript:alert(1)'
  assert.equal(html.renderer(common.preset()).renderInline(document), 'label')
  const heading = parser.parse('# title')
  assert.equal(heading.children[0].kind, commonNodes.names.Heading)
  heading.children[0].data.level = '1 onclick="alert(1)"'
  assert.throws(
    () => html.renderer(common.preset()).render(heading),
    /Invalid render payload/
  )
})
