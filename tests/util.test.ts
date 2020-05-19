import { escapeHtml } from '#/util'

describe('util', () => {
  it('can escape HTML (1)', () => {
    const actual = escapeHtml('<html></html>')
    const expected = '&lt;html&gt;&lt;/html&gt;'
    expect(actual).toBe(expected)
  })
  it('can escape HTML (2)', () => {
    const actual = escapeHtml('<div class="sub">this is sub</div>')
    const expected = '&lt;div class=&quot;sub&quot;&gt;this is sub&lt;/div&gt;'
    expect(actual).toBe(expected)
  })
  it('can escape HTML (3)', () => {
    const actual = escapeHtml('<p>a&b</p>')
    const expected = '&lt;p&gt;a&amp;b&lt;/p&gt;'
    expect(actual).toBe(expected)
  })
  it('can escape HTML (4)', () => {
    const actual = escapeHtml('&lt;')
    const expected = '&amp;lt;'
    expect(actual).toBe(expected)
  })
})
