import js from '@eslint/js'
import tsPlugin from 'typescript-eslint'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    files: ['**/*.vue'],
    plugins: { vue: vuePlugin },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsPlugin.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      ...vuePlugin.configs['vue3-recommended'].rules,
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
]
