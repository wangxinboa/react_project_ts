import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 部署到子路径（如 GitHub Pages：https://<user>.github.io/react_project_ts/）时，
// 通过环境变量注入前缀，例如：VITE_BASE=/react_project_ts/ npm run build
// 不设置时使用根路径 '/'，本地开发无需额外配置。
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
