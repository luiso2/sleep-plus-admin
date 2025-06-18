#!/bin/bash
# build-for-easypanel.sh - Script para construir la imagen localmente y subirla

echo "🏗️ Construyendo Sleep Plus Admin para EasyPanel..."

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

# Variables
IMAGE_NAME="sleep-plus-admin"
REGISTRY_URL=${1:-""}  # Pasar como primer argumento si tienes un registry

# Limpiar builds anteriores
echo "🧹 Limpiando builds anteriores..."
docker system prune -f

# Construir la imagen
echo "🔨 Construyendo imagen Docker..."
docker build \
  --build-arg VITE_API_URL="DYNAMIC_API_URL" \
  --build-arg VITE_APP_NAME="Sleep+ Admin" \
  --build-arg VITE_APP_VERSION="1.0.0" \
  --build-arg VITE_ENABLE_DEVTOOLS="false" \
  -t $IMAGE_NAME:latest \
  -t $IMAGE_NAME:$(date +%Y%m%d-%H%M%S) \
  .

if [ $? -ne 0 ]; then
    echo "❌ Error en el build"
    exit 1
fi

echo "✅ Build completado"

# Si se proporcionó un registry, subir la imagen
if [ ! -z "$REGISTRY_URL" ]; then
    echo "📤 Subiendo imagen a $REGISTRY_URL..."
    docker tag $IMAGE_NAME:latest $REGISTRY_URL/$IMAGE_NAME:latest
    docker push $REGISTRY_URL/$IMAGE_NAME:latest
    echo "✅ Imagen subida exitosamente"
fi

# Mostrar información de la imagen
echo "📊 Información de la imagen:"
docker images | grep $IMAGE_NAME

echo "🎉 ¡Listo! La imagen está lista para usar en EasyPanel"
