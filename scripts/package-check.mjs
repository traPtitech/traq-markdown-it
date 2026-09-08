import {
  mkdtemp,
  readFile,
  writeFile,
  copyFile,
  realpath,
  rm
} from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run npm run check:package')
const run = (args, cwd = root) =>
  execFileSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true
  })
const npm = (args, cwd) => run([npmCli, ...args], cwd)
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json')))
const sdk = path.resolve(
  root,
  packageJson.devDependencies['@traq-markdown-parser/traq'].slice(5)
)
const tempRoot = await realpath(tmpdir())
const directory = await mkdtemp(path.join(tempRoot, 'traq-renderer-package-'))
try {
  const archives = []
  for (const cwd of [sdk, root]) {
    const [packed] = JSON.parse(
      npm(
        ['pack', '--ignore-scripts', '--json', '--pack-destination', directory],
        cwd
      )
    )
    if (cwd === root) {
      const shipped = new Set(packed.files.map(file => file.path))
      for (const file of [
        'LICENSE',
        'dist/index.css',
        'dist/core/index.js',
        'dist/core/index.d.ts',
        'dist/traq/v1.js'
      ])
        if (!shipped.has(file))
          throw new Error('Missing renderer file: ' + file)
      for (const file of shipped)
        if (
          /^(?:src|tests|crates|go|\.private|node_modules)\//.test(file) ||
          /\.(?:wasm|mjs|mts|tgz)$/.test(file)
        )
          throw new Error('Unexpected renderer file: ' + file)
    }
    archives.push(path.join(directory, packed.filename))
  }
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({ private: true, type: 'module' })
  )
  npm(
    [
      'install',
      '--prefer-offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      ...archives
    ],
    directory
  )
  await copyFile(
    path.join(root, 'tests/types.ts'),
    path.join(directory, 'types.ts')
  )
  await copyFile(
    path.join(root, 'tests/package-runtime.mjs'),
    path.join(directory, 'runtime.mjs')
  )
  run(
    [
      fileURLToPath(import.meta.resolve('typescript/bin/tsc')),
      '--noEmit',
      '--strict',
      '--target',
      'ES2022',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      'types.ts'
    ],
    directory
  )
  process.stdout.write(run(['runtime.mjs'], directory))
} finally {
  if (path.dirname(path.resolve(directory)) !== tempRoot)
    throw new Error('Unexpected temporary consumer path')
  await rm(directory, { recursive: true, force: true })
}
