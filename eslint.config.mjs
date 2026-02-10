import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import jest from 'eslint-plugin-jest'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

const jestStyle = jest.configs['flat/style']

export default [
  {
    ignores: ['coverage', 'dist', 'node_modules']
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module'
      },
      globals: globals.browser
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error'
    }
  },
  {
    files: ['*.{js,mjs}'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off'
    }
  },
  {
    ...jestStyle,
    files: ['tests/**/*.ts'],
    rules: {
      ...jestStyle.rules,
      'jest/prefer-comparison-matcher': 'error',
      'jest/prefer-equality-matcher': 'error'
    }
  },
  prettier
]
