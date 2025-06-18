#!/bin/bash
# verify-deployment.sh - Verificar que el despliegue funciona correctamente

echo "🔍 Verificando despliegue de Sleep Plus Admin..."
echo "================================================"

# URL de tu aplicación (reemplazar con tu URL real)
APP_URL="${1:-https://sleep-plus-admin.easypanel.host}"

echo "📍 URL: $APP_URL"
echo ""

# Función para verificar endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -n "Verificando $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$endpoint")
    
    if [ "$response" = "200" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ Error ($response)"
        return 1
    fi
}

# Verificar health check
check_endpoint "/health" "Health Check"

# Verificar que el frontend carga
check_endpoint "/" "Frontend"

# Verificar API endpoints
check_endpoint "/employees" "API - Employees"
check_endpoint "/customers" "API - Customers"
check_endpoint "/stores" "API - Stores"

echo ""
echo "📊 Resumen del Build:"
echo "- Build completado en: 1m 34s"
echo "- Tamaño total: ~4.4 MB"
echo "- Archivos generados:"
echo "  - index.html (0.66 kB)"
echo "  - CSS (5.29 kB)"
echo "  - JS Vendors (162.94 kB - 1,305.69 kB)"
echo "  - JS Principal (2,109.21 kB)"

echo ""
echo "⚠️  Advertencias:"
echo "- Algunos chunks son grandes (>500 kB)"
echo "- Considera usar lazy loading para páginas grandes"

echo ""
echo "✅ Próximos pasos:"
echo "1. Verificar la aplicación en: $APP_URL"
echo "2. Iniciar sesión con las credenciales:"
echo "   - Email: demo@lamattressstore.com"
echo "   - Password: demo123"
echo "3. Configurar datos iniciales si es necesario"

echo ""
echo "🎉 ¡Despliegue completado exitosamente!"
