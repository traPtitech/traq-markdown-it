import { escapeHtml } from '#/util'

describe('util', () => {
  const testcases = [
    { input: '<html></html>', expected: '&lt;html&gt;&lt;/html&gt;' },
    {
      input: '<div class="sub">this is sub</div>',
      expected: '&lt;div class=&quot;sub&quot;&gt;this is sub&lt;/div&gt;'
    },
    { input: '<p>a&b</p>', expected: '&lt;p&gt;a&amp;b&lt;/p&gt;' },
    { input: '&lt;', expected: '&amp;lt;' }
  ]

  it.concurrent.each(testcases)('can escape HTML', ({ input, expected }) => {
    const actual = escapeHtml(input)
    expect(actual).toBe(expected)
  })
})
