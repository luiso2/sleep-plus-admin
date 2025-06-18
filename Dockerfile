# Dockerfile para Sleep Plus Admin
# Multi-stage build: Build frontend + Run backend

# Etapa 1: Build del frontend
FROM node:18-alpine AS frontend-builder

# Aumentar memoria para Node.js durante el build
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# IMPORTANTE: Instalar TODAS las dependencias (incluyendo devDependencies)
# Esto es necesario para que Vite y otras herramientas de build estén disponibles
RUN npm ci

# Copiar código fuente
COPY . .

# Configurar variables de entorno de build
# IMPORTANTE: NO establecer NODE_ENV aquí, Vite lo maneja internamente
ARG VITE_API_URL="DYNAMIC_API_URL"
ARG VITE_APP_NAME="Sleep+ Admin"
ARG VITE_APP_VERSION="1.0.0"
ARG VITE_ENABLE_DEVTOOLS="false"

# Construir la aplicación
RUN npm run build:prod

# Crear script para reemplazar URLs en runtime
RUN echo '#!/bin/sh\n\
API_URL="${API_URL:-}"\n\
if [ -z "$API_URL" ]; then\n\
  echo "Using relative URLs (same origin)"\n\
else\n\
  echo "Configuring API URL: $API_URL"\n\
  find /app/dist -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|DYNAMIC_API_URL|$API_URL|g" {} +\n\
fi' > /app/replace-api-url.sh && chmod +x /app/replace-api-url.sh

# Verificar que el build se completó
RUN if [ -d "dist" ] && [ -f "dist/index.html" ]; then \
      echo "✅ Build completado exitosamente"; \
      ls -la dist/; \
    else \
      echo "❌ Error: Build falló"; \
      exit 1; \
    fi

# Etapa 2: Imagen de producción
FROM node:18-alpine AS production

WORKDIR /app

# Instalar dumb-init para manejo de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sleep-admin -u 1001

# Copiar package.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copiar archivos necesarios
COPY server/ ./server/
COPY db.json ./
COPY routes.json ./
COPY start.sh ./

# Copiar archivos de configuración si existen
COPY .env.production .env

# Copiar build del frontend
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/replace-api-url.sh ./

# Permisos
RUN chown -R sleep-admin:nodejs /app && \
    chmod +x start.sh replace-api-url.sh

# Cambiar al usuario no-root
USER sleep-admin

# Puerto
EXPOSE 80

# Variables de entorno de runtime (no de build)
ENV NODE_ENV=production
ENV PORT=80
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
