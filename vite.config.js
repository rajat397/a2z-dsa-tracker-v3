import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/a2z-dsa-tracker-v3/',
    build: {
        chunkSizeWarningLimit: 1600,
    },
})
