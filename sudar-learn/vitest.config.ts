import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared-access': path.resolve(__dirname, '../shared/access/index.ts'),
      '@shared-access/inviteCodes': path.resolve(__dirname, '../shared/access/inviteCodes.ts'),
      '@shared-content-generation': path.resolve(__dirname, '../shared/content-generation/index.ts'),
      '@shared-content-generation/schemas': path.resolve(
        __dirname,
        '../shared/content-generation/schemas.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

