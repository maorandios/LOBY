import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function trimOrigin(v: string) {
  return v.replace(/\/$/, '')
}

/** HTTPS origin for OG/Twitter (scrapers need absolute URLs). Override with VITE_SITE_ORIGIN for a custom domain. */
function resolveSiteOrigin(): string {
  const explicit = process.env.VITE_SITE_ORIGIN?.trim()
  if (explicit) return trimOrigin(explicit)

  const netlify =
    process.env.DEPLOY_PRIME_URL?.trim() ||
    process.env.URL?.trim() ||
    process.env.DEPLOY_URL?.trim()
  if (netlify) return trimOrigin(netlify)

  const cf = process.env.CF_PAGES_URL?.trim()
  if (cf) return trimOrigin(cf)

  // Prefer current deployment host (correct for preview + production).
  const vercelHost = process.env.VERCEL_URL?.trim()
  if (vercelHost) {
    return vercelHost.startsWith('http') ? trimOrigin(vercelHost) : `https://${vercelHost}`
  }
  return ''
}

/** Absolute social preview URL for OG/Twitter; falls back to root-relative only when origin is unknown (local build). */
function socialImageUrlPlugin(): Plugin {
  const placeholderImage = '__SOCIAL_IMAGE_URL__'
  const placeholderCanon = '__SOCIAL_CANONICAL_URL__'
  return {
    name: 'social-image-url',
    transformIndexHtml(html) {
      const origin = resolveSiteOrigin()
      const canonical = origin ? `${origin}/` : '/'
      const imageUrl = origin ? `${origin}/social.png` : '/social.png'
      return html.replaceAll(placeholderImage, imageUrl).replaceAll(placeholderCanon, canonical)
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
