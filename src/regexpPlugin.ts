/*!
 * markdown-it-regexp
 * Copyright (c) 2014 Alex Kocharin
 * MIT Licensed
 */

import MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token'

export default function RegexpPlugin(
  regexp: RegExp,
  replacer: (match: RegExpMatchArray) => string
): (md: MarkdownIt) => void {
  let counter = 0

  return function (md) {
    const flags =
      (regexp.global ? 'g' : '') +
      (regexp.multiline ? 'm' : '') +
      (regexp.ignoreCase ? 'i' : '')
    const parsedRegexp = RegExp('^' + regexp.source, flags)
    const id = 'regexp-' + counter++

    md.inline.ruler.push(id, (state, silent) => {
      // slowwww... maybe use an advanced regexp engine for this
      const match = parsedRegexp.exec(state.src.slice(state.pos))
      if (!match) return false

      if (state.pending) {
        state.pushPending()
      }

      // valid match found, now we need to advance cursor
      const oldPos = state.pos
      state.pos += match[0].length

      // don't insert any tokens in silent mode
      if (silent) return true

      const token = state.push(id, '', 0) as Token & {
        meta: { match: RegExpMatchArray }
        position: number
        size: number
      }
      token.meta = { match: match }
      token.position = oldPos
      token.size = match[0].length

      return true
    })

    md.renderer.rules[id] = (tokens, idx) => {
      return replacer(tokens[idx]?.meta.match)
    }
  }
}
