import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared-content-generation': path.resolve(__dirname, '../shared/content-generation/index.ts'),
      '@shared-content-generation/schemas': path.resolve(
        __dirname,
        '../shared/content-generation/schemas.ts',
      ),
      '@shared-access': path.resolve(__dirname, '../shared/access/index.ts'),
      '@shared-access/*': path.resolve(__dirname, '../shared/access/*'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../shared/access/**/*.test.ts'],
  },
})

