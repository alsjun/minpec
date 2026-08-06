import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages는 https://<계정>.github.io/<저장소>/ 경로로 서비스되므로 상대 경로로 빌드합니다.
export default defineConfig({
  plugins: [react()],
  base: './',
})
