#!/bin/sh
# start.sh - Script de inicio para Sleep Plus Admin

echo "🚀 Iniciando Sleep Plus Admin..."
echo "📍 Entorno: ${NODE_ENV}"
echo "📡 Puerto: ${PORT}"

# Reemplazar DYNAMIC_API_URL si se proporciona API_URL
if [ ! -z "$API_URL" ]; then
  echo "🔄 Configurando API URL: $API_URL"
  ./replace-api-url.sh
else
  echo "📍 Usando URLs relativas (mismo origen)"
fi

# Verificar base de datos
if [ ! -f "/app/db.json" ]; then
  echo "⚠️  Base de datos no encontrada, creando una nueva..."
  echo '{"customers":[],"subscriptions":[],"evaluations":[],"employees":[],"stores":[],"calls":[],"sales":[],"campaigns":[],"achievements":[],"scripts":[],"commissions":[],"shopifySettings":[],"shopifyProducts":[],"shopifyCustomers":[],"shopifyCoupons":[],"activityLogs":[],"webhooks":[],"webhookEvents":[],"permissions":[],"userPermissionOverrides":[],"dailyGoals":[],"dailyProgress":[],"paymentLinks":[],"stripeConfig":[],"stripeSubscriptions":[],"stripeWebhooks":[]}' > /app/db.json
fi

# Iniciar servidor
echo "🎯 Iniciando servidor..."
exec node server/server.js
