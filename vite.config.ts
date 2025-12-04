import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: false, // Try next available port if 8080 is in use
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Xian Herbs - Traditional Thai Medicine',
        short_name: 'Xian Herbs',
        description: 'Practitioner platform for Traditional Thai Medicine formulas',
        theme_color: '#1a472a',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        prefer_related_applications: false,
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Orders',
            short_name: 'Orders',
            description: 'View and manage orders',
            url: '/dashboard/orders',
            icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Messages',
            short_name: 'Messages',
            description: 'View patient messages',
            url: '/dashboard/practitioner/messages',
            icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Patients',
            short_name: 'Patients',
            description: 'Manage patients',
            url: '/dashboard/patients',
            icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/xizvezmghzgxgeliuiym\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
