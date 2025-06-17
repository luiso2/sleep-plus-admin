// server/config.js
// Configuración del servidor para diferentes entornos

const config = {
  // Puerto del servidor
  port: process.env.PORT || 8080,
  
  // Host del servidor
  host: process.env.HOST || '127.0.0.1',
  
  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Access-Token']
  },
  
  // Configuración de la base de datos
  database: {
    path: process.env.DB_PATH || './db.json'
  },
  
  // Configuración de Shopify
  shopify: {
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
  },
  
  // Configuración de Stripe
  stripe: {
    // Las claves se obtendrán de la base de datos o variables de entorno
  },
  
  // Configuración del entorno
  environment: process.env.NODE_ENV || 'development',
  
  // URLs base para diferentes servicios
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
    api: process.env.API_URL || `http://127.0.0.1:${process.env.PORT || 8080}`
  }
};

module.exports = config;
