# Configuración para EasyPanel

## Variables de Entorno Requeridas

En EasyPanel, configura estas variables de entorno en la sección "Environment Variables" de tu aplicación:

```
NODE_ENV=production
PORT=80
HOST=0.0.0.0
```

## Build Arguments (Opcional)

Si quieres personalizar el nombre de la aplicación o versión durante el build, puedes agregar estos Build Arguments:

```
VITE_APP_NAME=Sleep+ Admin
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEVTOOLS=false
```

## Configuración de la Aplicación

1. **General Settings:**
   - App Name: `sleep-plus-admin` (o el nombre que prefieras)
   - Deploy Method: `Dockerfile`

2. **Source:**
   - Repository: Tu repositorio de Git
   - Branch: `main` (o la rama que uses)
   - Build Context: `/`
   - Dockerfile Path: `Dockerfile`

3. **Deploy:**
   - Port: `80`
   - Expose Port: ✅ Enabled

4. **Domains:**
   - EasyPanel asignará automáticamente un dominio como:
     `https://sleep-plus-admin.tuusuario.easypanel.host`
   - También puedes agregar tu propio dominio personalizado

5. **Health Check (Opcional):**
   - Path: `/health`
   - Interval: `30`
   - Timeout: `10`
   - Retries: `3`

## Volúmenes Persistentes

Para mantener la base de datos entre despliegues:

1. En la sección "Mounts", agrega:
   - Mount Path: `/app/db.json`
   - Host Path: `./data/db.json`

## Comandos Post-Despliegue

No se requieren comandos adicionales. La aplicación detectará automáticamente su URL y se configurará apropiadamente.

## Verificación

Después del despliegue, verifica:

1. Accede a: `https://tu-app.easypanel.host/health`
   - Deberías ver un JSON con `status: "ok"`

2. Accede a la aplicación principal: `https://tu-app.easypanel.host`
   - Deberías ver la página de login

3. Verifica las APIs: `https://tu-app.easypanel.host/employees`
   - Deberías ver datos JSON

## Troubleshooting

Si tienes problemas:

1. **Error 502 Bad Gateway:**
   - Verifica que el puerto esté configurado como 80
   - Revisa los logs de la aplicación

2. **APIs no funcionan:**
   - Verifica que NODE_ENV=production esté configurado
   - Revisa la consola del navegador para errores CORS

3. **Cambios no se reflejan:**
   - EasyPanel puede cachear el build
   - Intenta hacer un "Force Rebuild"

## Seguridad

1. **Cambia las contraseñas por defecto** en el primer login
2. **Configura HTTPS** (EasyPanel lo hace automáticamente)
3. **Respalda regularmente** el archivo db.json
