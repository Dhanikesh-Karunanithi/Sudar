import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${path.resolve(__dirname, './src')}/` },
      { find: /^@shared-sudarsim\//, replacement: `${path.resolve(__dirname, '../shared/sudarsim')}/` },
      { find: /^@shared-sudarart\//, replacement: `${path.resolve(__dirname, '../shared/sudarart')}/` },
      { find: /^@shared-access$/, replacement: path.resolve(__dirname, '../shared/access/index.ts') },
      { find: /^@shared-access\//, replacement: `${path.resolve(__dirname, '../shared/access')}/` },
      { find: /^@shared-feedback\//, replacement: `${path.resolve(__dirname, '../shared/feedback')}/` },
      {
        find: /^@shared-content-generation$/,
        replacement: path.resolve(__dirname, '../shared/content-generation/index.ts'),
      },
      {
        find: /^@shared-content-generation\//,
        replacement: `${path.resolve(__dirname, '../shared/content-generation')}/`,
      },
      // Shared modules live outside this package, so pin zod to Studio's install.
      { find: /^zod$/, replacement: path.resolve(__dirname, './node_modules/zod') },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
