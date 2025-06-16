import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine if we're in Bolt environment or development
  const isBolt = mode === 'development' && !env.VITE_ENVIRONMENT;
  const isDev = env.VITE_ENVIRONMENT === 'development';
  
  // Base configuration for Bolt environment
  const boltConfig = {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
  
  // Configuration for your development environment
  const devConfig = {
    plugins: [react()],
    base: "/shopifyreact/",
    server: {
      port: 5173,
      strictPort: true,
      origin: "https://hushloladre.com",
      hmr: {
        clientPort: 443,
        protocol: "wss",
        host: "hushloladre.com",
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
  
  // Return appropriate configuration based on environment
  if (isDev) {
    return devConfig;
  }
  
  return boltConfig;
});