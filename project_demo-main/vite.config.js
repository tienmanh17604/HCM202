import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['bc90-1-52-240-28.ngrok-free.app', '8f15-1-52-240-28.ngrok-free.app'],
  },
})
