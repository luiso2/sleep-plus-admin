# Despliegue en EasyPanel - Sleep Plus Admin

## 🚨 Solución al Error: Frontend No Visible

### Problema Identificado
El servidor backend está funcionando pero no sirve los archivos del frontend. Esto ocurre porque:
1. El puerto configurado no coincide (muestra 80 pero espera 8080)
2. Los archivos estáticos del frontend no se están sirviendo correctamente
3. Posible problema con la ruta del directorio `dist` en el contenedor

### Solución Rápida

1. **Usa el nuevo Dockerfile**: `Dockerfile.easypanel-fixed`
2. **Configura el puerto a 80** en EasyPanel
3. **Verifica localmente** ejecutando: `verify-easypanel-fix.bat`

## 📋 Pasos Detallados para Desplegar

### 1. Verificación Local (IMPORTANTE)

Antes de desplegar, ejecuta la verificación local:

```bash
# Windows
verify-easypanel-fix.bat

# Linux/Mac
chmod +x verify-easypanel-fix.sh
./verify-easypanel-fix.sh
```

Esto probará el build completo y te mostrará si el frontend está disponible.

### 2. Configuración en EasyPanel

#### General Settings:
- **Port**: `80` (IMPORTANTE: usar 80, no 8080)
- **Dockerfile**: `Dockerfile.easypanel-fixed`
- **Build Context**: `/` (raíz del proyecto)

#### Environment Variables:
```env
NODE_ENV=production
PORT=80
HOST=0.0.0.0
API_URL=https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host
```

#### Build Arguments:
```env
VITE_API_URL=https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host
VITE_APP_NAME=Sleep+ Admin
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEVTOOLS=false
```

### 3. Debugging en Producción

Una vez desplegado, visita estos endpoints para verificar:

1. **Health Check**: 
   ```
   https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host/health
   ```
   Debe mostrar: `{"status":"ok","frontend":true}`

2. **Debug Files**:
   ```
   https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host/api/debug/files
   ```
   Muestra la estructura de archivos y confirma si `dist` existe

3. **Frontend**:
   ```
   https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host/
   ```
   Debe cargar la aplicación React

### 4. Si el Frontend NO Carga

Si ves solo los endpoints de API pero no el frontend:

1. **Revisa los logs del build en EasyPanel**:
   - Busca errores durante `npm run build`
   - Verifica que se muestre "Contenido de dist:" con archivos

2. **Usa el servidor de debug**:
   - En EasyPanel, cambia el CMD a: `["node", "server/server-debug.js"]`
   - Esto proporcionará más información de logging

3. **Verifica la estructura de archivos**:
   - El endpoint `/api/debug/files` te mostrará exactamente qué archivos ve el servidor

## 🔧 Soluciones Alternativas

### Opción A: Servidor Nginx + Node.js

Si el problema persiste, considera separar el frontend y backend:

1. Crea un servicio Nginx para servir el frontend
2. Configura el backend como API en otro servicio
3. Usa proxy_pass en Nginx para las rutas `/api/*`

### Opción B: Build Manual

1. Construye el frontend localmente: `npm run build`
2. Sube la carpeta `dist` a un CDN o servidor estático
3. Configura CORS en el backend para permitir el dominio del frontend

## 📊 Estructura Esperada

Después del build, la estructura debe ser:
```
/app/
├── server/
│   └── server.js
├── dist/
│   ├── index.html
│   ├── assets/
│   └── ...
├── db.json
├── routes.json
└── package.json
```

## 🚀 Comandos Útiles

```bash
# Ver logs en tiempo real (EasyPanel CLI si está disponible)
easypanel logs sleep-plus-admin -f

# Entrar al contenedor
docker exec -it [container-id] sh

# Verificar archivos dentro del contenedor
docker exec [container-id] ls -la /app/dist
```

## ✅ Checklist de Verificación

- [ ] El build local funciona con `verify-easypanel-fix.bat`
- [ ] El puerto está configurado a 80 en EasyPanel
- [ ] Las variables de entorno están configuradas
- [ ] El Dockerfile usado es `Dockerfile.easypanel-fixed`
- [ ] El health check responde con `frontend: true`
- [ ] El endpoint de debug muestra que existe `/app/dist`
- [ ] La aplicación React carga correctamente

## 🆘 Último Recurso

Si nada funciona, contacta soporte con:
1. Los logs completos del build
2. El resultado de `/api/debug/files`
3. El contenido del health check
4. Una captura de la configuración en EasyPanel

---

**Última actualización**: Frontend no visible - Solución con puerto 80 y verificación mejorada
