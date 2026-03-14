import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['chokidar', '@modelcontextprotocol/sdk']
      }
    }
  },
  preload: {},
  renderer: {
    plugins: [react()]
  }
})
