module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/member-delimiter-style': 'off'
  },
  overrides: [
    {
      // 直下のファイル
      files: ['*.{js,mjs}'],
      excludedFiles: ['*/**/*.{js,mjs}'],
      env: {
        node: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['tests/**/*.ts'],
      extends: ['plugin:jest/style'],
      env: {
        node: true
      },
      rules: {
        'jest/prefer-comparison-matcher': 'error',
        'jest/prefer-equality-matcher': 'error'
      }
    }
  ],
  reportUnusedDisableDirectives: true
}
