#!/bin/bash
# verify-docker-build.sh - Verificación de build de Docker

echo "🔍 Verificando configuración de Docker para Sleep Plus Admin..."
echo "=================================================="

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que exista package.json
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json encontrado"
else
    echo -e "${RED}✗${NC} package.json NO encontrado"
    exit 1
fi

# Verificar que exista package-lock.json
if [ -f "package-lock.json" ]; then
    echo -e "${GREEN}✓${NC} package-lock.json encontrado"
else
    echo -e "${YELLOW}!${NC} package-lock.json NO encontrado - se generará durante el build"
fi

# Verificar que Vite esté en devDependencies
if grep -q '"vite"' package.json; then
    echo -e "${GREEN}✓${NC} Vite encontrado en dependencias"
    VITE_VERSION=$(grep '"vite"' package.json | cut -d'"' -f4)
    echo "  Version: $VITE_VERSION"
else
    echo -e "${RED}✗${NC} Vite NO encontrado en package.json"
    exit 1
fi

# Verificar Dockerfile
if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✓${NC} Dockerfile encontrado"
    
    # Verificar que NO use --omit=dev en la etapa de build
    if grep -A5 "frontend-builder" Dockerfile | grep -q "npm ci --omit=dev\|npm install --omit=dev"; then
        echo -e "${RED}✗${NC} ERROR: Dockerfile usa --omit=dev en la etapa de build del frontend"
        echo -e "${YELLOW}!${NC} Esto causará el error 'vite: not found'"
        exit 1
    else
        echo -e "${GREEN}✓${NC} Dockerfile configurado correctamente para instalar devDependencies"
    fi
else
    echo -e "${RED}✗${NC} Dockerfile NO encontrado"
    exit 1
fi

# Verificar vite.config.ts
if [ -f "vite.config.ts" ]; then
    echo -e "${GREEN}✓${NC} vite.config.ts encontrado"
else
    echo -e "${RED}✗${NC} vite.config.ts NO encontrado"
    exit 1
fi

# Verificar estructura de directorios
echo ""
echo "📁 Verificando estructura de directorios..."
REQUIRED_DIRS=("src" "server" "public")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} Directorio $dir/ encontrado"
    else
        echo -e "${RED}✗${NC} Directorio $dir/ NO encontrado"
    fi
done

# Test de build local (opcional)
echo ""
echo "🔨 ¿Deseas hacer un test de build local? (s/n)"
read -r response
if [[ "$response" =~ ^([sS])$ ]]; then
    echo "Ejecutando build de prueba..."
    docker build --target frontend-builder -t sleep-admin-test .
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Build de prueba exitoso"
    else
        echo -e "${RED}✗${NC} Build de prueba falló"
        exit 1
    fi
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Verificación completa${NC}"
echo ""
echo "📝 Próximos pasos para EasyPanel:"
echo "1. Commit y push de todos los cambios"
echo "2. En EasyPanel: Detener el servicio actual"
echo "3. Limpiar caché de Docker si es posible"
echo "4. Hacer un nuevo deploy"
echo ""
echo "Si el problema persiste, usa Dockerfile.easypanel que fue creado como backup"
