import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /Weather_Dashboard_App/, Vercel serves it from the root
  base: process.env.VERCEL ? "/" : "/Weather_Dashboard_App/",
  plugins: [react()],
})
