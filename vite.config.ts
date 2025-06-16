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
      allowedHosts: ['hushloladre.com'],
      strictPort: true,
      hmr: false, // Disable HMR to prevent WebSocket conflicts
    },
    optimizeDeps: {
      include: ["lucide-react"], // Include lucide-react for proper bundling
      force: true, // Force re-optimization
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'lucide': ['lucide-react']
          }
        }
      }
    }
  };

  // Configuration for your development environment
  const devConfig = {
    plugins: [react()],
    base: "/shopifyreact/",
    server: {
      port: 5173,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: ['hushloladre.com'],
      hmr: false, // Disable HMR to prevent conflicts with Socket.IO
    },
    optimizeDeps: {
      include: ["lucide-react"], // Include lucide-react for proper bundling
      force: true, // Force re-optimization
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'lucide': ['lucide-react']
          }
        }
      }
    }
  };

  // Return appropriate configuration based on environment
  if (isDev) {
    return devConfig;
  }

  return boltConfig;
});