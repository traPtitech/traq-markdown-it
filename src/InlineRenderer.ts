import type { Options } from 'markdown-it'
import /* tree-shaking no-side-effects-when-called */ Renderer, {
  RenderRuleRecord
} from 'markdown-it/lib/renderer'
import type Token from 'markdown-it/lib/token'
import { escapeHtml } from './util'

export class InlineRenderer extends Renderer {
  /**
   * Rulesのblockルールは使われない
   * blockRulesに入れたもののみ利用される
   */
  private blockRules: RenderRuleRecord = {}

  setRules(
    defaultRules: RenderRuleRecord | null = null,
    overrideRules: RenderRuleRecord = {}
  ): void {
    if (defaultRules !== null) {
      this.rules = { ...defaultRules }
    }

    /* eslint-disable @typescript-eslint/no-non-null-assertion */

    this.rules.softbreak = () => ' '
    this.blockRules.softbreak = () => ' '
    this.rules.hardbreak = () => ' '
    this.blockRules.hardbreak = () => ' '

    this.rules.image = (tokens, idx) => {
      const token = tokens[idx]!
      const attrsStr = (token.attrs ?? [])
        .filter(([attr]) => attr !== 'src' && attr !== 'alt')
        .map(([key, val]) => `${escapeHtml(key)}="${escapeHtml(val)}"`)
        .join(' ')
      return `<a href="${
        token.attrGet('src') ?? ''
      }" ${attrsStr} data-is-image>${token.content}</a>`
    }

    this.blockRules.code_block = this.rules.code_inline
    this.blockRules.fence = this.rules.code_inline
    this.blockRules.hr = (tokens, idx) => ` ${tokens[idx]!.markup} `
    this.blockRules.heading_open = (tokens, idx) =>
      `${'#'.repeat(+tokens[idx]!.tag.slice(1))} `
    this.blockRules.blockquote_open = (tokens, idx) => `${tokens[idx]!.markup} `
    this.blockRules.list_item_open = (tokens, idx) => `${tokens[idx]!.markup} `
    this.blockRules.th_open = () => '| '
    this.blockRules.td_open = () => '| '
    this.blockRules.tr_close = () => ' |'

    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    for (const [key, val] of Object.entries(overrideRules)) {
      this.rules[key] = val
      this.blockRules[key] = val
    }
  }

  renderContent(token: Token): string {
    return escapeHtml(token.content)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  render(tokens: Token[], options: Options, env: any): string {
    let result = ''

    for (const [i, token] of tokens.entries()) {
      const type = token.type
      const blockRule = this.blockRules[type]

      // 意味の切れ目に空白を入れる
      if (token.nesting === 1 && tokens[i - 1]?.nesting === -1) {
        result += ' '
      }

      if (type === 'inline') {
        result += this.renderInline(token.children ?? [], options, env)
      } else if (blockRule !== undefined) {
        result += blockRule(tokens, i, options, env, this)
      } else {
        result += this.renderContent(token)
      }
    }

    return result
  }
}
