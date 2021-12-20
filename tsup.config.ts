import { defineConfig } from 'tsup'

export default defineConfig({
  target: 'es2020',
  dts: true,
  sourcemap: true,
  format: ['cjs', 'esm']
})
