const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, '..', 'db.json'));
const middlewares = jsonServer.defaults();

// Configurar CORS
server.use(cors(config.cors));

// Middleware de logging
server.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Usar middlewares por defecto de JSON Server
server.use(middlewares);

// Agregar middleware para manejar PATCH como PUT
server.use((req, res, next) => {
  if (req.method === 'PATCH') {
    console.log(`🔄 Converting PATCH to PUT for: ${req.originalUrl}`);
    req.method = 'PUT';
  }
  next();
});

// Usar el router de JSON Server
server.use(router);

// Endpoint de salud
server.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.environment 
  });
});

// Iniciar servidor
const PORT = config.port;
server.listen(PORT, config.host, () => {
  console.log(`🚀 JSON Server running on http://${config.host}:${PORT}`);
  console.log(`📊 Environment: ${config.environment}`);
  console.log(`🌐 CORS Origins: ${JSON.stringify(config.cors.origin)}`);
  console.log(`📝 Database: ${path.join(__dirname, '..', 'db.json')}`);
  console.log(`✅ Server ready to handle requests`);
}); 