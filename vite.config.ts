import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@models': path.resolve(__dirname, './src/models'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@services': path.resolve(__dirname, './src/services'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@demo': path.resolve(__dirname, './src/demo'),
    },
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      // 允许访问 box2d-js 文件夹
      allow: ['..']
    }
  },
  // 将 box2d-js 作为静态资源
  publicDir: 'public',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    // 复制 box2d-js 到输出目录
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      }
    }
  },
});
