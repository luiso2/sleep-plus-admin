# 🚀 Guía Rápida EasyPanel - Sleep Plus Admin

## ✅ Variables de Entorno Requeridas

```env
PORT=80
HOST=0.0.0.0
```

⚠️ **NO incluir NODE_ENV=production en las variables**

## 📦 Opciones de Despliegue

### Opción 1: Dockerfile Optimizado (Recomendado)
- Dockerfile Path: `Dockerfile.easypanel`
- Build más rápido y ligero

### Opción 2: Dockerfile Estándar
- Dockerfile Path: `Dockerfile`
- Build completo con todas las optimizaciones

### Opción 3: Imagen Pre-construida
1. Usa GitHub Actions (automático en cada push)
2. En EasyPanel usa: `ghcr.io/tu-usuario/sleep-plus-admin:latest`

## 🔧 Configuración en EasyPanel

### General
```
App Name: sleep-plus-admin
Deploy Method: Dockerfile
```

### Source
```
Repository: [Tu repo]
Branch: main
Build Context: /
Dockerfile Path: Dockerfile.easypanel
```

### Deploy
```
Port: 80
Expose Port: ✅
```

### Volumes (Persistencia)
```
Mount Path: /app/db.json
Host Path: ./data/db.json
```

## 🐛 Solución de Problemas

### Build muy lento o falla
1. Aumentar memoria a 4GB
2. Usar `Dockerfile.easypanel`
3. Usar imagen pre-construida

### Error de NODE_ENV
- NO incluir NODE_ENV en variables de entorno
- El Dockerfile lo maneja automáticamente

### APIs no funcionan
- Verificar que el puerto sea 80
- La app detecta la URL automáticamente

## 🎯 Verificación

1. Health: `https://tu-app.easypanel.host/health`
2. API: `https://tu-app.easypanel.host/employees`
3. App: `https://tu-app.easypanel.host`

## 📝 Notas

- Primera vez: DB vacía, agregar datos iniciales
- Backups: Configurar backup del volumen
- SSL: EasyPanel lo maneja automáticamente
