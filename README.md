# Sleep+ Admin System

Sistema de administración para Sleep+ Elite y Trade & Sleep.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js >= 18.0.0
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone [url-del-repositorio]
cd sleep-plus-admin

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Iniciar en modo desarrollo
npm run dev
```

El sistema estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📁 Estructura del Proyecto

```
sleep-plus-admin/
├── src/                    # Código fuente del frontend
│   ├── components/         # Componentes reutilizables
│   ├── pages/             # Páginas de la aplicación
│   ├── providers/         # Providers de Refine (auth, data, etc.)
│   ├── services/          # Servicios y utilidades
│   └── interfaces/        # Tipos TypeScript
├── server/                # Backend Express
│   ├── server.js         # Servidor principal
│   └── config.js         # Configuración del servidor
├── scripts/              # Scripts de utilidad
├── .env                  # Variables de entorno (desarrollo)
├── .env.production       # Variables de entorno (producción)
└── vite.config.ts        # Configuración de Vite
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia frontend y backend
npm run client          # Solo frontend
npm run server          # Solo backend

# Construcción
npm run build           # Build de producción
npm run build:prod      # Build con modo producción explícito

# Producción
npm run start:prod      # Inicia servidor en modo producción
npm run preview         # Preview del build

# Utilidades
npm run check:urls      # Verifica URLs hardcodeadas
npm run lint            # Ejecuta ESLint
npm run type-check      # Verifica tipos TypeScript
```

## 🔧 Configuración

### Variables de Entorno

#### Frontend (Variables VITE_*)
- `VITE_API_URL`: URL del backend API
- `VITE_APP_NAME`: Nombre de la aplicación
- `VITE_APP_VERSION`: Versión de la aplicación
- `VITE_ENABLE_DEVTOOLS`: Activar herramientas de desarrollo

#### Backend
- `PORT`: Puerto del servidor (default: 3001)
- `NODE_ENV`: Entorno (development/production)
- `CORS_ORIGIN`: Origen permitido para CORS
- `DB_PATH`: Ruta de la base de datos JSON

## 🚀 Despliegue

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas de despliegue.

### Verificación Pre-despliegue

```bash
# Verificar URLs hardcodeadas
npm run check:urls

# Verificar tipos
npm run type-check

# Ejecutar linting
npm run lint

# Build de prueba
npm run build:prod
```

## 🔐 Seguridad

- Las variables sensibles deben estar en `.env` (nunca commitear)
- Configurar CORS apropiadamente para producción
- Usar HTTPS en producción
- Actualizar regularmente las dependencias

## 🧪 Testing

```bash
# Ejecutar pruebas (cuando estén implementadas)
npm test
```

## 📝 Características

### Módulos Principales
- **Dashboard**: Panel principal con métricas
- **Clientes**: Gestión de clientes
- **Suscripciones**: Control de suscripciones
- **Evaluaciones T&S**: Sistema Trade & Sleep
- **Call Center**: Centro de llamadas integrado
- **Empleados**: Gestión de personal
- **Ventas**: Registro y seguimiento
- **Campañas**: Gestión de campañas

### Integraciones
- **Shopify**: Productos, clientes y cupones
- **Stripe**: Pagos y suscripciones
- **Webhooks**: Eventos automatizados

## 🐛 Solución de Problemas

### El servidor no inicia
```bash
# Verificar puerto disponible
lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# Cambiar puerto si es necesario
PORT=3002 npm run server
```

### Error de CORS
- Verificar `CORS_ORIGIN` en las variables de entorno
- Asegurar que el frontend use la URL correcta del API

### Build falla
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentación Adicional

- [Refine Documentation](https://refine.dev/docs/)
- [Ant Design Components](https://ant.design/components/overview)
- [Vite Guide](https://vitejs.dev/guide/)

## 🤝 Contribución

1. Crear rama desde `main`
2. Hacer cambios
3. Ejecutar `npm run check:urls` antes de commit
4. Crear Pull Request

## 📄 Licencia

Privado - Todos los derechos reservados
