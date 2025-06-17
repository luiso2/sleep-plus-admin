#!/bin/sh
# start.sh - Script de inicio dinámico para Sleep Plus Admin

echo "🚀 Iniciando Sleep Plus Admin..."
echo "📍 Entorno: ${NODE_ENV:-development}"
echo "📡 Puerto: ${PORT:-80}"

# Si no se proporciona API_URL, intentar detectarla
if [ -z "$API_URL" ]; then
  # En EasyPanel, la URL viene en la variable RAILWAY_PUBLIC_DOMAIN o similar
  # Si no, usar la URL actual
  if [ ! -z "$EASYPANEL_URL" ]; then
    export API_URL="https://$EASYPANEL_URL"
  elif [ ! -z "$RAILWAY_PUBLIC_DOMAIN" ]; then
    export API_URL="https://$RAILWAY_PUBLIC_DOMAIN"
  elif [ ! -z "$RENDER_EXTERNAL_URL" ]; then
    export API_URL="$RENDER_EXTERNAL_URL"
  elif [ ! -z "$HEROKU_APP_NAME" ]; then
    export API_URL="https://$HEROKU_APP_NAME.herokuapp.com"
  else
    # Usar URL relativa por defecto
    export API_URL=""
  fi
fi

echo "🌐 API URL: ${API_URL:-'Relative URLs (same origin)'}"

# Reemplazar DYNAMIC_API_URL en los archivos del build
if [ ! -z "$API_URL" ]; then
  echo "🔄 Configurando URLs en archivos estáticos..."
  find /app/dist -type f \( -name "*.js" -o -name "*.html" \) | while read file; do
    # Usar un archivo temporal para evitar problemas
    cp "$file" "$file.tmp"
    sed "s|DYNAMIC_API_URL|$API_URL|g" "$file.tmp" > "$file"
    rm "$file.tmp"
  done
  echo "✅ URLs configuradas"
fi

# Verificar que la base de datos existe
if [ ! -f "/app/db.json" ]; then
  echo "⚠️  Base de datos no encontrada, creando una nueva..."
  echo '{"customers":[],"subscriptions":[],"evaluations":[],"employees":[],"stores":[],"calls":[],"sales":[],"campaigns":[],"achievements":[],"scripts":[],"commissions":[],"shopifySettings":[],"shopifyProducts":[],"shopifyCustomers":[],"shopifyCoupons":[],"activityLogs":[],"webhooks":[],"webhookEvents":[],"permissions":[],"userPermissionOverrides":[],"dailyGoals":[],"dailyProgress":[],"paymentLinks":[],"stripeConfig":[],"stripeSubscriptions":[],"stripeWebhooks":[]}' > /app/db.json
  echo "✅ Base de datos creada"
fi

# Iniciar el servidor
echo "🎯 Iniciando servidor Node.js..."
exec node server/server.js
