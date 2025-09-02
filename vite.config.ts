import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        // Указываем путь к исходному файлу preload.ts
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Эта секция явно говорит Vite, что нужно обработать renderer-процесс
      renderer: {}, 
    }),
    // Этот плагин обеспечивает корректную работу preload в режиме разработки
    renderer(),
  ],
})

