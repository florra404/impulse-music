import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // The entry file of the main process.
        entry: 'electron/main.ts',
      },
      preload: {
        // Optional, Preload scripts dispatch events for safe Renderer process interaction.
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Optional, enable static resource copy.
      // renderer: {},
    }),
  ],
})