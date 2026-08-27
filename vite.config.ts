import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    server: {
      port: 3005,
      // DISABLE_HMR=true인 자동화 환경에서는 화면 깜박임을 막기 위해 HMR을 끈다.
      hmr: process.env.DISABLE_HMR !== 'true',
      // 같은 환경에서 불필요한 파일 감시도 함께 끈다.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
