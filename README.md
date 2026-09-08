# traq-markdown-it

型付き Markdown AST から HTML を生成する traQ 向けのフロントエンドライブラリです。構文解析を [traq-markdown-parser/traq](https://github.com/traq-markdown-parser/traq) に分離しています。

```ts
import { createRuntime, presets } from '@traq-markdown-parser/traq'
import { renderer } from '@traptitech/traq-markdown-it'
import { v1 } from '@traptitech/traq-markdown-it/traq'
import '@traptitech/traq-markdown-it/index.css'

const runtime = await createRuntime(wasmBytes)
try {
  const parser = runtime.createParser(presets.traq.v1)
  const view = renderer(v1.html({ store }))
  const html: string = view.render(parser.parse('**hello** :stamp:'))
  const inline: string = view.renderInline(parser.parseInline('**hello**'))
} finally {
  runtime.dispose()
}
```

`store` はスタンプ画像や参照先 URL を解決するアプリケーション側のオブジェクトです。省略も可能で、解決できない参照やスタンプは文字列として表示します。Runtime と Parser はアプリケーション内で再利用してください。

## traQ の本文・引用・添付とプレビュー

traQ のメッセージ表示には、本文 HTML とカード用の情報をまとめて返す `v1.messageRenderer` を使います。

```ts
const messages = v1.messageRenderer({ store, origin: 'https://q.example.test' })
const document = parser.parse(source)
const { renderedText, embeddings } = messages.render(document)
const preview = messages.renderInline(document).renderedText
```

通常表示では末尾の裸の添付・引用 URL を本文から除き、`embeddings` にファイル・メッセージ ID と外部 URL を返します。明示的なリンクは本文に残し、spoiler・コード内の URL はカードにしません。入力 AST は変更しないため、通常表示とプレビューで同じ document を再利用できます。

`messages.renderInline` は全文の AST を一行プレビューにします。通常の改行・強制改行・空行はスペースに、見出しやリストはマーカー付きの表示にし、残った添付・引用リンクは短いラベルに置き換えます。コード内容の改行は文字列として保持します。ブロック数式もインライン表示にし、既定の数式サイズを制限します。

ここには `parser.parse(source)` の結果を渡します。`parser.parseInline` と汎用 `renderer.renderInline` はインライン構文用で、メッセージ全体をプレビューにする API ではありません。

## 所有する機能

| 公開入口            | 責務                                                               |
| ------------------- | ------------------------------------------------------------------ |
| パッケージルート    | `renderer`、`Plugin`、`PresetBuilder`、構造型の AST / HTML context |
| `/commonmark`       | CommonMark の HTML、リンク・画像の検証方針                         |
| `/generic`          | 数式、表、取り消し線、mark の HTML                                 |
| `/trap`             | スタンプ、参照、spoiler、空行の表示と `Store` 型                   |
| `/traq`、`/traq/v1` | traQ 向けの表示 preset                                             |
| `/index.css`        | Markdown、スタンプエフェクトなどの CSS                             |

traQ preset は改行、コードのハイライトとキャプション、KaTeX、外部リンク属性、画像ドメインの既定方針を組み合わせます。文法の採用と表示 handler の採用は独立しているため、画像ノードを扱う場合も parser 側の文法構成に従います。

AST を直接たどって HTML 文字列を生成します。実行時に markdown-it は使用しません。markdown-it は CommonMark の出力を比較するテスト専用の開発用依存です。

## 表示を変更する

```ts
import { renderer, PresetBuilder } from '@traptitech/traq-markdown-it'
import { plugin, nodes } from '@traptitech/traq-markdown-it/commonmark'

const common = plugin()
common.replace(nodes.Link, (node, context) => context.inline(node.children))
const view = renderer(new PresetBuilder().add(common).build())
```

`on(kind, handler)` は追加、`replace(kind, handler)` は既存 handler の変更です。handler は HTML 文字列を返します。原文や payload の文字列を埋め込むときは `context.escape()`、子ノードは `context.inline()` / `context.blocks()`、原文へのフォールバックは `context.fallback()` を使用してください。HTML 構文は既定でエスケープします。

独自の表示 Plugin は `@traptitech/traq-markdown-it/definitions` の宣言から作ります。構文のプリセットは Rust 側で定義します。builder は追加時の実装を保持するため、後から Plugin を変更しても既存 preset は変化しません。

## 開発

Node.js 24 以降を使います。開発用の traQ Markdown 配布リポジトリは次の相対配置に置きます。

```text
GitHub/
  traq-markdown-parser/traq/
  traPtitech/traq-markdown-it/
```

先に `traq-markdown-parser/traq` で `npm ci` と `npm run build` を実行し、このリポジトリで次を実行します。

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run check:architecture
npm run check:package
npm run example
```

実装は `src/**/*.ts`、JavaScript と型定義は `tsc` による `dist/` の生成物です。`check:package` は SDK と renderer の2つの npm アーカイブを新規 consumer に導入し、公開型・HTML・CSS・Wasm の接続を検証します。開発用の `file:` 依存とは別に、配布 package は SDK の semver peer dependency を宣言しています。

現行の作業版はレジストリ未公開です。従来の自動 publish workflow は外し、CI はビルドと検証を行います。
