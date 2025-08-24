import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',   // rutas relativas para que funcione en file://
  plugins: [react()]
})