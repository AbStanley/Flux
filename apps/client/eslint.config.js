import { fileURLToPath } from 'url'
import { dirname } from 'path'
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'] },
  // 1. Base JS rules
  js.configs.recommended,
  // 2. TypeScript Strict + Stylistic rules (spread as they are arrays)
  // 2. TypeScript Recommended rules (Relaxed from strict to allow dev)
  ...tseslint.configs.recommended,
  // ...tseslint.configs.stylistic, // Commented out to reduce stylistic noise
  // 3. React Hooks (Flat config compatible object)
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  // 4. Globals for public scripts running in extension/worker contexts
  {
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      },
    },
  },
  // 5. Custom Configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactRefresh.configs.vite.rules,
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
)
