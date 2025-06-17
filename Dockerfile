# Dockerfile para Sleep Plus Admin
# Multi-stage build: Build frontend + Run backend

# Etapa 1: Build del frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build del frontend para producción
RUN npm run build

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
RUN npm ci --only=production && npm cache clean --force

# Copiar código del servidor
COPY server/ ./server/
COPY db.json ./
COPY routes.json ./

# Copiar archivos de configuración
COPY .env.* ./

# Copiar build del frontend desde la etapa anterior
COPY --from=frontend-builder /app/dist ./dist

# Crear directorio para archivos estáticos
RUN mkdir -p ./public && chown -R sleep-admin:nodejs /app

# Cambiar al usuario no-root
USER sleep-admin

# Exponer puerto
EXPOSE 8080

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/server.js"] 