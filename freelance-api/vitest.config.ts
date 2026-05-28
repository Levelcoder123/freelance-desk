import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
    },
    globalSetup: ['./tests/setup/globalSetup.js'],
    setupFiles: ['./tests/setup/setup.js'],
    include: ['tests/**/*.test.js'],
  },
})
