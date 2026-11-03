import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: [
        '**/public/Gomikin/**',
        '**/model_parts/**',
        '**/*.glb',
        '**/*.usdz',
        '**/*.zip',
        '**/scratch/**',
      ],
    },
  },
});

