import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

const files = new Map()
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = directory + '/' + entry.name
    if (entry.isDirectory()) await collect(file)
    else if (/\.(?:ts|mjs|mts|js)$/.test(file))
      files.set(file, await readFile(file, 'utf8'))
  }
}
await collect('src')
for (const [file, text] of files) {
  assert(
    file.endsWith('.ts') && !file.endsWith('.d.ts'),
    `${file}: implementation must be TypeScript`
  )
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      const specifier = node.moduleSpecifier.text
      if (specifier.startsWith('.')) {
        const target = path.posix
          .normalize(path.posix.join(path.posix.dirname(file), specifier))
          .replace(/\.js$/, '.ts')
        assert(files.has(target), `${file}: unresolved ${specifier}`)
        if (file.startsWith('src/core/'))
          assert(
            target.startsWith('src/core/'),
            `${file}: core depends on a grammar`
          )
        if (file.startsWith('src/commonmark/'))
          assert(
            !/^src\/(?:trap|traq)\//.test(target),
            `${file}: CommonMark depends on traP`
          )
        if (file.startsWith('src/trap/'))
          assert(
            !target.startsWith('src/traq/'),
            `${file}: traP depends on traQ`
          )
      } else {
        assert.notEqual(
          specifier,
          '@traq-markdown-parser/ts',
          `${file}: rendering must not load the Wasm runtime`
        )
        assert(
          !specifier.startsWith('@traptitech/traq-markdown-it'),
          `${file}: use internal relative imports`
        )
        if (specifier.startsWith('markdown-it/'))
          assert(
            file.startsWith('src/core/'),
            `${file}: token backend stays in core`
          )
        if (
          file.startsWith('src/core/') &&
          specifier.startsWith('@traq-markdown-parser/ts/')
        )
          assert.equal(
            specifier,
            '@traq-markdown-parser/ts/definitions',
            `${file}: core must not know grammar payloads`
          )
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}
console.log(`Renderer boundaries passed: ${files.size} TypeScript modules`)
