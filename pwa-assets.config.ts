import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Иконки приложения создаются из public/icon.svg командой: npm run icons
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: { background: '#f7f5f2' } },
    apple: { ...minimal2023Preset.apple, padding: 0.12, resizeOptions: { background: '#f7f5f2' } },
  },
  images: ['public/icon.svg'],
})
