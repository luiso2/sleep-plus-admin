# 🐳 Despliegue con Docker - Sleep Plus Admin

Esta guía te ayudará a desplegar Sleep Plus Admin usando Docker y Docker Compose.

## 📋 Prerrequisitos

- Docker Engine 20.10+
- Docker Compose v2.0+
- Git

## 🚀 Despliegue Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/luiso2/sleep-plus-admin.git
cd sleep-plus-admin
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.production

# Editar configuración para producción
nano .env.production
```

Variables importantes:
```env
NODE_ENV=production
PORT=8080
VITE_API_URL=http://tu-dominio.com:8080
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### 3. Construir y ejecutar

```bash
# Construir y ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 4. Verificar despliegue

```bash
# Verificar que el contenedor esté ejecutándose
docker-compose ps

# Verificar salud del servicio
curl http://localhost:8080/health
```

## 🛠️ Comandos Útiles

### Gestión del servicio

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs en tiempo real
docker-compose logs -f sleep-plus-admin

# Acceder al contenedor
docker-compose exec sleep-plus-admin sh
```

### Actualización

```bash
# Obtener última versión
git pull origin main

# Reconstruir imagen
docker-compose build --no-cache

# Reiniciar con nueva imagen
docker-compose up -d
```

### Backup de datos

```bash
# Hacer backup de la base de datos
docker-compose exec sleep-plus-admin cp db.json db.json.backup

# Copiar backup al host
docker cp sleep-plus-admin:/app/db.json.backup ./backup-$(date +%Y%m%d).json
```

## 🌐 Despliegue con Nginx (Opcional)

Para usar Nginx como proxy reverso:

```bash
# Crear archivo de configuración nginx.conf
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream sleep_admin {
        server sleep-plus-admin:8080;
    }

    server {
        listen 80;
        server_name tu-dominio.com;

        location / {
            proxy_pass http://sleep_admin;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Ejecutar con Nginx
docker-compose --profile with-nginx up -d
```

## 🔧 Configuración Avanzada

### Variables de entorno del contenedor

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto del servidor | `8080` |
| `HOST` | Host de binding | `0.0.0.0` |
| `VITE_API_URL` | URL del API frontend | `http://localhost:8080` |

### Volúmenes persistentes

```yaml
volumes:
  # Base de datos persistente
  - ./db.json:/app/db.json
  
  # Configuración personalizada
  - ./server/config.js:/app/server/config.js
  
  # Logs (opcional)
  - ./logs:/app/logs
```

### Health Check

El contenedor incluye un health check automático:

```bash
# Verificar salud manualmente
docker exec sleep-plus-admin node -e "
require('http').get('http://localhost:8080/health', (res) => {
  console.log('Status:', res.statusCode);
  process.exit(res.statusCode === 200 ? 0 : 1);
})"
```

## 🚨 Solución de Problemas

### El contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs sleep-plus-admin

# Verificar configuración
docker-compose config

# Revisar recursos
docker system df
```

### Error de permisos

```bash
# Verificar propiedad de archivos
ls -la db.json

# Cambiar permisos si es necesario
chmod 644 db.json
```

### Puerto ocupado

```bash
# Verificar qué proceso usa el puerto
netstat -tulpn | grep :8080

# Cambiar puerto en docker-compose.yml
ports:
  - "8081:8080"  # Usa puerto 8081 en el host
```

### Problemas de red

```bash
# Verificar red de Docker
docker network ls
docker network inspect sleep-plus-admin_sleep-admin-network

# Recrear red
docker-compose down
docker network prune
docker-compose up -d
```

## 📊 Monitoreo

### Logs estructurados

```bash
# Seguir logs en tiempo real
docker-compose logs -f --tail=100

# Filtrar logs por nivel
docker-compose logs | grep ERROR

# Exportar logs
docker-compose logs --no-color > logs-$(date +%Y%m%d).txt
```

### Métricas del contenedor

```bash
# Estadísticas en tiempo real
docker stats sleep-plus-admin

# Información del contenedor
docker inspect sleep-plus-admin
```

## 🔐 Seguridad

### Configuración de seguridad recomendada

```bash
# Ejecutar con usuario no-root (ya configurado)
# Exponer solo puertos necesarios
# Usar secrets para credenciales sensibles

# Ejemplo con Docker secrets
echo "tu_stripe_secret_key" | docker secret create stripe_secret -
```

### Firewall

```bash
# Permitir solo puerto 8080
ufw allow 8080
ufw enable
```

## 📈 Escalabilidad

### Múltiples instancias

```yaml
# docker-compose.yml
services:
  sleep-plus-admin:
    # ... configuración existente
    deploy:
      replicas: 3
```

### Load Balancer

```yaml
# Usando Nginx como load balancer
upstream sleep_cluster {
    server sleep-plus-admin-1:8080;
    server sleep-plus-admin-2:8080;
    server sleep-plus-admin-3:8080;
}
```

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica la configuración: `docker-compose config`
3. Consulta la documentación: [GitHub Issues](https://github.com/luiso2/sleep-plus-admin/issues)

¡Tu aplicación Sleep Plus Admin debería estar corriendo en http://localhost:8080! 🎉 