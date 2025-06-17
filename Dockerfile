# Dockerfile para Sleep Plus Admin
# Multi-stage build: Build frontend + Run backend

# Etapa 1: Build del frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# IMPORTANTE: Instalar TODAS las dependencias (incluyendo devDependencies)
# Esto es necesario para que Vite y otras herramientas de build estén disponibles
RUN if [ -f package-lock.json ]; then \
    npm ci; \
    else \
    npm install; \
    fi

# Copiar código fuente
COPY . .

# Configurar variables de entorno de build con valores por defecto para EasyPanel
ARG VITE_API_URL=https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host
ARG VITE_APP_NAME="Sleep+ Admin"
ARG VITE_APP_VERSION="1.0.0"
ARG VITE_ENABLE_DEVTOOLS="false"

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_ENABLE_DEVTOOLS=${VITE_ENABLE_DEVTOOLS}

# Build del frontend para producción
RUN npm run build

# Verificar que el build se completó correctamente
RUN echo "Verificando build del frontend..." && \
    ls -la dist/ && \
    echo "Build completado exitosamente"

# Etapa 2: Imagen de producción
FROM node:18-alpine AS production

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S sleep-admin -u 1001

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN if [ -f package-lock.json ]; then \
    npm ci --omit=dev; \
    else \
    npm install --omit=dev; \
    fi \
    && npm cache clean --force

# Copiar código del servidor
COPY server/ ./server/
COPY db.json ./
COPY routes.json ./

# Copiar archivos de configuración si existen
COPY .env.* ./

# Copiar build del frontend desde la etapa anterior
COPY --from=frontend-builder /app/dist ./dist

# Crear directorio para archivos estáticos
RUN mkdir -p ./public && chown -R sleep-admin:nodejs /app

# Cambiar al usuario no-root
USER sleep-admin

# Exponer puerto 80 para EasyPanel
EXPOSE 80

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=80
ENV HOST=0.0.0.0
ENV API_URL=${API_URL:-https://telegram-crm-millonario-sleep-plus-admin.dqyvuv.easypanel.host}
ENV FRONTEND_URL=${FRONTEND_URL:-https://telegram-crm-millonario-sleep-plus-admin.dqyvuv.easypanel.host}
ENV CORS_ORIGIN=${CORS_ORIGIN:-https://telegram-crm-millonario-sleep-plus-admin.dqyvuv.easypanel.host}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:80/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/server.js"]
