import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Baca file sinkronisasi system_settings.json secara dinamis
let proxyTarget = 'http://localhost/wp-content';
let uploadFolder = 'uploads';

let baseDir = '/wp-content/';

try {
  const configPath = path.resolve(__dirname, 'system_settings.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const cfg = JSON.parse(raw);
    const domain = (cfg.local_proxy_target || cfg.main_domain || 'http://localhost').replace(/\/+$/, '');
    const sub = cfg.sub_path ? '/' + cfg.sub_path.replace(/^\/+|\/+$/g, '') : '';
    proxyTarget = domain + sub;
    if (cfg.upload_folder) uploadFolder = cfg.upload_folder.replace(/^\/+|\/+$/g, '');
    baseDir = sub ? `${sub}/` : '/';
  }
} catch (e) {}

if (process.env.VITE_BASE_PATH) {
  baseDir = process.env.VITE_BASE_PATH;
}

const proxyConfig = {
  '/wp_api': {
    target: proxyTarget,
    changeOrigin: true,
  }
};
proxyConfig[`/${uploadFolder}`] = {
  target: proxyTarget,
  changeOrigin: true,
};

export default defineConfig(({ command }) => ({
  base: command === 'build' ? baseDir : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: proxyConfig
  }
}));
