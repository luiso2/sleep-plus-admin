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
    '/webhookEvents',
    '/permissions',
    '/userPermissionOverrides',
    '/dailyGoals',
    '/dailyProgress',
    '/paymentLinks',
    '/stripeConfig',
    '/stripeSubscriptions',
    '/stripeWebhooks'
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
      proxy: mode === 'development' ? proxyConfig : undefined,
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
      exclude: ['shopify-api-node'],
      // Pre-bundle heavy dependencies
      include: ['react', 'react-dom', 'antd', '@ant-design/icons']
    },
    // Configuración de build para producción
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      // Aumentar límite de advertencia a 1MB
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Configuración mejorada de chunks
          manualChunks: (id) => {
            // node_modules chunks
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // Ant Design y sus iconos
              if (id.includes('antd') || id.includes('@ant-design')) {
                return 'antd-vendor';
              }
              // Refine framework
              if (id.includes('@refinedev')) {
                return 'refine-vendor';
              }
              // Gráficos y visualización
              if (id.includes('recharts') || id.includes('d3')) {
                return 'charts-vendor';
              }
              // Utilidades
              if (id.includes('axios') || id.includes('dayjs') || id.includes('uuid') || id.includes('lodash')) {
                return 'utils-vendor';
              }
              // Stripe
              if (id.includes('stripe')) {
                return 'stripe-vendor';
              }
              // Otros vendors
              return 'vendor';
            }
            
            // Separar páginas grandes
            if (id.includes('src/pages/shopify')) {
              return 'shopify-pages';
            }
            if (id.includes('src/pages/dashboard')) {
              return 'dashboard';
            }
            if (id.includes('src/pages/call-center')) {
              return 'call-center';
            }
          },
          // Optimizar nombres de archivos
          entryFileNames: 'assets/js/[name]-[hash].js',
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/js/${chunkInfo.name}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/img/[name]-[hash][extname]`;
            } else if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`;
            } else {
              return `assets/[name]-[hash][extname]`;
            }
          }
        },
      },
    },
    // Optimizaciones específicas para EasyPanel
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    }
  };
});
