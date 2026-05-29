import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rhema Seat Map',
        short_name: 'RhemaSeats',
        description: 'Offline-first church seating tracker for M/W/C attendance',
        theme_color: '#6d28d9',
        background_color: '#f3f4f6',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache all build artifacts
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Google Fonts — cache first
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Apps Script endpoint — network first, 8s timeout, fall back to last response
            urlPattern: ({ url }) =>
              url.hostname === 'script.google.com' ||
              url.hostname === 'script.googleusercontent.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gas-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
