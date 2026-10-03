import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'vector-score',   // -> dist/vector-score.js
    },
  },
  plugins: [dts({ rollupTypes: true })],   // one dist/index.d.ts
});