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
  plugins: [
    typescript(),
    nodeResolve({
      preferBuiltins: true,
      // Ensure node_modules are searched for dependencies
      moduleDirectories: ['node_modules'],
    }),
    commonjs({
      // Improve CommonJS conversion, especially for npm modules
      transformMixedEsModules: true,
      // Handle CommonJS modules with named exports
      requireReturnsDefault: 'auto',
      // The named exports can be accessed directly after importing
    }),
    json(),
  ],
  // Preserve the modules structure but bundle core dependencies
  preserveModules: false,
  // Treat some Node.js built-in modules as external
  external: ['path', 'fs', 'os', 'http', 'https', 'events', 'util', 'stream', 'buffer'],
}

export default config
