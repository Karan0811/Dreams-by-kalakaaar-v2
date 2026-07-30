import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/modules': path.resolve(__dirname, 'src/modules'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/jobs': path.resolve(__dirname, 'src/jobs'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
    },
  },
});
