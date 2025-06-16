import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), "");

  // Determine if we're in Bolt environment or development
  const isBolt = mode === "bolt" || (mode === "development" && !env.VITE_ENVIRONMENT);
  const isDev = env.VITE_ENVIRONMENT === "development";

  // Base configuration for Bolt environment
  const boltConfig = {
    plugins: [react()],
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: false,
      hmr: false, // Disable HMR to prevent WebSocket conflicts
      allowedHosts: ['hushloladre.com', 'localhost', '127.0.0.1', '.hushloladre.com'],
    },
    optimizeDeps: {
      // Removed lucide-react from exclude to allow pre-bundling
    },
  };

  // Configuration for your development environment
  const devConfig = {
    plugins: [react()],
    base: "/shopifyreact/",
    server: {
      port: 5173,
      strictPort: false,
      host: '0.0.0.0',
      hmr: false, // Disable HMR to prevent conflicts with Socket.IO
      allowedHosts: ['hushloladre.com', 'localhost', '127.0.0.1', '.hushloladre.com'],
    },
    optimizeDeps: {
      // Removed lucide-react from exclude to allow pre-bundling
    },
  };

  // Return appropriate configuration based on environment
  if (isDev) {
    return devConfig;
  }

  return boltConfig;
});