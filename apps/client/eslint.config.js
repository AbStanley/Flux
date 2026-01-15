import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['default'],
              message: 'Import named exports from "react" instead (e.g., import { useState } from "react").',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSTypeReference[typeName.active=true][typeName.left.name="React"][typeName.right.name="FC"]',
          message: 'Do not use React.FC. Use function declarations instead.',
        },
        {
          selector: 'TSTypeReference[typeName.name="FunctionComponent"]',
          message: 'Do not use FunctionComponent. Use function declarations instead.',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
