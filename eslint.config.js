import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  ignores: ['.github/**', 'dist/**', '.licenses/**'],
})
