// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    dir: 'dist',
    format: 'es',
    sourcemap: true,
  },
  plugins: [typescript(), nodeResolve({ preferBuiltins: true }), commonjs(), json()],
  external: [
    // Keep external dependencies that are provided by the GitHub Actions runner
    '@actions/core',
    'archiver',
    'conventional-changelog-angular',
    'conventional-recommended-bump',
    'form-data',
  ],
}

export default config
