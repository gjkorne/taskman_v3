import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    deps: {
      inline: ['@testing-library/react', '@testing-library/dom'],
    },
  },
});
