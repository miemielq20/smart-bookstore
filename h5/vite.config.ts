import uni from '@dcloudio/vite-plugin-uni'

export default {
  plugins: [uni()],
  server: {
    host: '0.0.0.0',
    port: 5051,
    strictPort: true,
    proxy: {
      '/api': {
        // 开发代理仍指向本机后端，真机访问 H5 时由手机连接电脑的 H5 服务地址。
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5051,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "uview-plus/theme.scss";',
      },
    },
  },
}
