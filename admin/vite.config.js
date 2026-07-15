import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Admin dashboard runs on its own port, separate from the customer app.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
})
