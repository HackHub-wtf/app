import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { codecovVitePlugin } from '@codecov/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'hackhub-app',
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
})
