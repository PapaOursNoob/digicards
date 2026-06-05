import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'DigiCollection',
        short_name: 'DigiCollection',
        description: 'Manage your Digimon Card Game collection',
        theme_color: '#00d4ff',
        icons: [
          {
            src: 'src/assets/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'src/assets/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/digimoncard\.dev\/api-public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'digimon-api-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'router-vendor': ['react-router-dom'],
        }
      }
    }
  }
});
