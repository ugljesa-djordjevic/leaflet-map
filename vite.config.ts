import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The LocationMap widget imports host-app modules via the `src/...` alias
// (src/models, src/store, src/services, src/utils, src/modules) — same
// convention as the real dashboard app.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    // MapLibre 6 boots a module worker from a URL relative to its own module
    // (maplibre-gl-worker.mjs). Vite's dep pre-bundling relocates the package
    // and breaks that URL, deadlocking style load — serve it unbundled.
    exclude: ['maplibre-gl'],
  },
});
