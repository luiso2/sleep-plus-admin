import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno basadas en el modo (development/production)
  const env = loadEnv(mode, process.cwd(), '');
  
  // URL del API - usa variable de entorno o fallback a localhost
  const apiUrl = env.VITE_API_URL || 'http://127.0.0.1:3001';
  
  // Lista de rutas que necesitan proxy
  const proxyRoutes = [
    '/api/shopify',
    '/employees',
    '/customers',
    '/subscriptions',
    '/evaluations',
    '/stores',
    '/calls',
    '/sales',
    '/campaigns',
    '/achievements',
    '/scripts',
    '/commissions',
    '/shopifySettings',
    '/shopifyProducts',
    '/shopifyCustomers',
    '/shopifyCoupons',
    '/activityLogs',
    '/webhooks',
    '/webhookEvents'
  ];
  
  // Crear configuración de proxy dinámicamente
  const proxyConfig = proxyRoutes.reduce((acc: Record<string, any>, route) => {
    acc[route] = {
      target: apiUrl,
      changeOrigin: true,
      secure: false,
    };
    return acc;
  }, {});
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: proxyConfig,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    define: {
      // Define global variables for compatibility
      'process.env': {},
      'global': {},
    },
    optimizeDeps: {
      // Exclude problematic Node.js libraries
      exclude: ['shopify-api-node']
    },
    // Configuración de build para producción
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons'],
            refine: ['@refinedev/core', '@refinedev/antd'],
          },
        },
      },
    },
  };
});
