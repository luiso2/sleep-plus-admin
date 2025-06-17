#!/bin/bash
# Script para verificar que el build de Docker funciona correctamente

echo "🔍 Verificando build de Docker para Sleep Plus Admin..."
echo "=================================================="

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que existe package-lock.json
if [ ! -f "package-lock.json" ]; then
    echo -e "${RED}❌ ERROR: No se encontró package-lock.json${NC}"
    echo -e "${YELLOW}➡️  Generando package-lock.json...${NC}"
    npm install
fi

# Verificar que vite está en devDependencies
if ! grep -q '"vite"' package.json; then
    echo -e "${RED}❌ ERROR: Vite no está en las dependencias${NC}"
    exit 1
fi

echo -e "${GREEN}✅ package-lock.json encontrado${NC}"
echo -e "${GREEN}✅ Vite está en devDependencies${NC}"

# Test build local
echo ""
echo "🏗️  Probando build local..."
npm install
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build local exitoso${NC}"
else
    echo -e "${RED}❌ Build local falló${NC}"
    exit 1
fi

# Test Docker build
echo ""
echo "🐳 Probando Docker build..."
docker build -t sleep-plus-admin-test .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker build exitoso${NC}"
else
    echo -e "${RED}❌ Docker build falló${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Todas las verificaciones pasaron correctamente!${NC}"
echo ""
echo "📋 Próximos pasos para EasyPanel:"
echo "1. Asegúrate de que EasyPanel esté usando el Dockerfile correcto"
echo "2. Las variables de entorno deben estar configuradas:"
echo "   - VITE_API_URL"
echo "   - VITE_APP_NAME"
echo "   - VITE_APP_VERSION"
echo "   - VITE_ENABLE_DEVTOOLS"
echo "3. El puerto debe ser 8080"
echo ""
