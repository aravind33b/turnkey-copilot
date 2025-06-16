import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  banner: ({ format }) => {
    if (format === 'cjs') {
      return '#!/usr/bin/env node';
    }
    return '';
  },
});