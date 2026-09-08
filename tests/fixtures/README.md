# CommonMark fixtures

Unmodified 652 examples from John MacFarlane’s [CommonMark 0.31.2 specification](https://spec.commonmark.org/0.31.2/spec.json), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

`renderer-corpus-regressions.json` contains synthetic, minimal examples of a
rendering regression found while comparing 100,000 private corpus messages.
These examples contain no original message text or identifiers. Their expected
HTML was verified against the Token-based renderer at `778285e`, using the same
Rust parser as the direct HTML renderer.

The cases cover blank-line nodes after paragraphs in tight bullet, ordered, and
nested lists, consecutive blank-line nodes, and a loose-list control. They run
with `npm test`; the private corpus is not required.
