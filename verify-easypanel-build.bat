@echo off
echo ====================================
echo Verificando Build para EasyPanel
echo ====================================
echo.

echo Construyendo imagen Docker...
docker build ^
  --build-arg VITE_API_URL="https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host" ^
  --build-arg VITE_APP_NAME="Sleep+ Admin" ^
  --build-arg VITE_APP_VERSION="1.0.0" ^
  --build-arg VITE_ENABLE_DEVTOOLS="false" ^
  -t sleep-admin-test .

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la construccion de la imagen
    pause
    exit /b 1
)

echo.
echo Ejecutando contenedor de prueba...
docker run -d --name sleep-test -p 3000:80 -e PORT=80 -e HOST=0.0.0.0 sleep-admin-test

echo.
echo Esperando que el servidor inicie...
timeout /t 5 /nobreak > nul

echo.
echo ====================================
echo Verificando health check...
echo ====================================
curl -f http://localhost:3000/health
echo.
echo.

echo ====================================
echo Verificando archivos del sistema...
echo ====================================
curl -f http://localhost:3000/api/debug/files
echo.
echo.

echo ====================================
echo Verificando frontend...
echo ====================================
curl -f -s http://localhost:3000/ -o test-index.html
if exist test-index.html (
    echo Frontend HTML recibido correctamente
    findstr /i "react" test-index.html > nul
    if %ERRORLEVEL% EQU 0 (
        echo React app detectada en el HTML
    ) else (
        echo WARNING: No se detecto React en el HTML
    )
    del test-index.html
) else (
    echo ERROR: No se pudo obtener el frontend
)

echo.
echo ====================================
echo Logs del contenedor (ultimas 50 lineas):
echo ====================================
docker logs --tail 50 sleep-test

echo.
echo Limpiando...
docker stop sleep-test > nul 2>&1
docker rm sleep-test > nul 2>&1

echo.
echo ====================================
echo Verificacion completada
echo ====================================
echo.
echo CONFIGURACION PARA EASYPANEL:
echo - Dockerfile: Dockerfile
echo - Puerto: 80
echo - Variables de entorno:
echo   NODE_ENV=production
echo   PORT=80
echo   HOST=0.0.0.0
echo   API_URL=https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host
echo.
echo - Build Arguments:
echo   VITE_API_URL=https://telegram-crm-millonario-sleep-admin.dqyvuv.easypanel.host
echo   VITE_APP_NAME=Sleep+ Admin
echo   VITE_APP_VERSION=1.0.0
echo   VITE_ENABLE_DEVTOOLS=false
echo.
pause
