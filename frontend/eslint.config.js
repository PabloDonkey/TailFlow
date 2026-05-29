import js from '@eslint/js'
import tsPlugin from 'typescript-eslint'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  ...vuePlugin.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/design-system/reka/**', 'src/design-system/motion/**'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          {
            name: 'reka-ui',
            message: 'Import reka-ui only from src/design-system/reka wrappers.',
          },
          {
            name: 'motion-v',
            message: 'Import motion-v only from src/design-system/motion wrappers.',
          },
        ],
        patterns: ['reka-ui/*', 'motion-v/*'],
      }],
    },
  },
  {
    files: ['src/__tests__/**/*.{ts,vue}'],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsPlugin.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
]
