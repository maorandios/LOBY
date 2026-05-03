import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Absolute social preview URL for OG/Twitter (crawlers require https). Uses VITE_SITE_ORIGIN, or Vercel deployment host. */
function socialImageUrlPlugin(): Plugin {
  const placeholder = '__SOCIAL_IMAGE_URL__'
  return {
    name: 'social-image-url',
    transformIndexHtml(html) {
      const trimOrigin = (v: string) => v.replace(/\/$/, '')
      const fromEnv = process.env.VITE_SITE_ORIGIN?.trim()
      const vercelHost = process.env.VERCEL_URL?.trim()
      let origin = fromEnv ? trimOrigin(fromEnv) : ''
      if (!origin && vercelHost) {
        origin = vercelHost.startsWith('http') ? trimOrigin(vercelHost) : `https://${vercelHost}`
      }
      const imageUrl = origin ? `${origin}/social.png` : '/social.png'
      return html.replaceAll(placeholder, imageUrl)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), socialImageUrlPlugin()],
  server: {
    port: 3000,
  },
  /** Pre-bundle heavy CJS deps so the dev optimizer does not 504 after dependency changes. */
  optimizeDeps: {
    include: ['lottie-web'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
