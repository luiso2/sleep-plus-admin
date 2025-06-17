# Guía de Despliegue - Sleep Plus Admin

## Configuración de Variables de Entorno

Este proyecto utiliza variables de entorno para gestionar diferentes configuraciones entre desarrollo y producción.

### Variables de Entorno Disponibles

#### Frontend (Vite)
- `VITE_API_URL`: URL del servidor backend (por defecto: `http://localhost:3001`)
- `VITE_APP_NAME`: Nombre de la aplicación
- `VITE_APP_VERSION`: Versión de la aplicación
- `VITE_ENABLE_DEVTOOLS`: Habilitar herramientas de desarrollo (true/false)

#### Backend (Node.js)
- `PORT`: Puerto del servidor (por defecto: 80 para producción/EasyPanel, 3001 para desarrollo)
- `HOST`: Host del servidor (por defecto: 0.0.0.0)
- `NODE_ENV`: Entorno de ejecución (development/production)
- `CORS_ORIGIN`: Origen permitido para CORS (por defecto: *)
- `DB_PATH`: Ruta de la base de datos JSON (por defecto: ./db.json)
- `FRONTEND_URL`: URL del frontend (para referencias)
- `API_URL`: URL del API (para referencias)

## Configuración para Desarrollo Local

1. Usar el archivo `.env` existente (ya configurado)
2. Ejecutar: `npm run dev`

## Configuración para Producción

### Paso 1: Configurar Variables de Entorno

1. Copiar `.env.production` y renombrarlo a `.env.production.local`
2. Actualizar las variables según tu entorno de producción:

```bash
# .env.production.local
VITE_API_URL=https://api.tu-dominio.com
VITE_APP_NAME=Sleep+ Admin
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEVTOOLS=false
```

### Paso 2: Construir el Frontend

```bash
# Construir para producción
npm run build

# Vista previa local del build
npm run preview
```

### Paso 3: Configurar el Servidor Backend

Para el servidor backend en producción, configura estas variables de entorno:

```bash
# Variables de entorno del servidor
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
DB_PATH=/path/to/production/db.json
```

### Paso 4: Despliegue en la Nube

#### Opción A: Despliegue en Vercel (Frontend)

1. Instalar Vercel CLI: `npm i -g vercel`
2. En la raíz del proyecto: `vercel`
3. Configurar las variables de entorno en el dashboard de Vercel

#### Opción B: Despliegue en Heroku (Backend)

1. Crear archivo `Procfile`:
```
web: node server/server.js
```

2. Configurar variables de entorno en Heroku:
```bash
heroku config:set PORT=3001
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://tu-frontend.vercel.app
```

#### Opción C: Despliegue en EasyPanel (Recomendado)

EasyPanel simplifica el despliegue usando Docker:

1. **Configuración en EasyPanel**:
   - Port: `80`
   - Dockerfile: `Dockerfile`
   - Build Context: `/`

2. **Variables de Entorno**:
   ```env
   NODE_ENV=production
   PORT=80
   HOST=0.0.0.0
   API_URL=https://tu-app.easypanel.host
   ```

3. **Build Arguments**:
   ```env
   VITE_API_URL=https://tu-app.easypanel.host
   VITE_APP_NAME=Sleep+ Admin
   VITE_APP_VERSION=1.0.0
   VITE_ENABLE_DEVTOOLS=false
   ```

4. **Verificar despliegue**:
   - Health check: `https://tu-app.easypanel.host/health`
   - Debug: `https://tu-app.easypanel.host/api/debug/files`

#### Opción D: Despliegue en VPS (Servidor Completo)

1. Instalar Node.js y PM2 en el servidor
2. Clonar el repositorio
3. Crear archivo `.env` con las variables de producción
4. Instalar dependencias: `npm install --production`
5. Construir frontend: `npm run build`
6. Iniciar con PM2:

```bash
# ecosystem.config.js para PM2
module.exports = {
  apps: [{
    name: 'sleep-plus-api',
    script: './server/server.js',
    env: {
      PORT: 3001,
      NODE_ENV: 'production'
    }
  }]
}

# Iniciar
pm2 start ecosystem.config.js
```

7. Configurar Nginx para servir el frontend y proxy del API:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Frontend
    location / {
        root /var/www/sleep-plus-admin/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Consideraciones de Seguridad

1. **Variables Sensibles**: Nunca subir archivos `.env` con datos sensibles al repositorio
2. **CORS**: Configurar `CORS_ORIGIN` específicamente para tu dominio de producción
3. **HTTPS**: Siempre usar HTTPS en producción
4. **Base de Datos**: Considerar migrar de JSON a una base de datos real para producción

## Verificación Post-Despliegue

1. Verificar que el API responda: `https://tu-api.com/health`
2. Verificar conexión frontend-backend desde la consola del navegador
3. Probar funcionalidades críticas:
   - Login
   - CRUD de recursos
   - Integración con Shopify
   - Webhooks

## Troubleshooting

### Problema: "API no responde en producción"
- Verificar que `VITE_API_URL` esté configurado correctamente
- Verificar configuración de CORS en el servidor
- Revisar logs del servidor

### Problema: "Build falla en producción"
- Verificar todas las dependencias estén en `dependencies` (no en `devDependencies`)
- Limpiar caché: `rm -rf node_modules package-lock.json && npm install`

### Problema: "Rutas no funcionan después del despliegue"
- Asegurarse de que el servidor web está configurado para SPA (redirigir todo a index.html)
- Verificar la configuración de proxy en producción

## Scripts Útiles

```bash
# Verificar variables de entorno
npm run build -- --mode production
grep -r "localhost" dist/  # No debería encontrar nada

# Test de endpoints
curl https://tu-api.com/health
curl https://tu-api.com/employees
```

## Mantenimiento

- Actualizar versión en `package.json` y `.env.production` antes de cada despliegue
- Hacer backup de `db.json` antes de actualizar el servidor
- Monitorear logs y métricas después del despliegue
