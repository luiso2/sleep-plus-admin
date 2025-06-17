@echo off
REM Script para verificar que el build de Docker funciona correctamente en Windows

echo =====================================
echo Verificando build de Docker para Sleep Plus Admin...
echo =====================================
echo.

REM Verificar que existe package-lock.json
if not exist "package-lock.json" (
    echo ERROR: No se encontro package-lock.json
    echo Generando package-lock.json...
    call npm install
    if errorlevel 1 (
        echo ERROR: Fallo la instalacion de npm
        exit /b 1
    )
)

echo [OK] package-lock.json encontrado
echo.

REM Test build local
echo Probando build local...
call npm install
if errorlevel 1 (
    echo ERROR: Fallo npm install
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ERROR: Fallo npm run build
    exit /b 1
)

echo [OK] Build local exitoso
echo.

REM Test Docker build
echo Probando Docker build...
docker build -t sleep-plus-admin-test .
if errorlevel 1 (
    echo ERROR: Docker build fallo
    exit /b 1
)

echo [OK] Docker build exitoso
echo.

echo =====================================
echo Todas las verificaciones pasaron correctamente!
echo =====================================
echo.
echo Proximos pasos para EasyPanel:
echo 1. Asegurate de que EasyPanel este usando el Dockerfile correcto
echo 2. Las variables de entorno deben estar configuradas:
echo    - VITE_API_URL
echo    - VITE_APP_NAME
echo    - VITE_APP_VERSION
echo    - VITE_ENABLE_DEVTOOLS
echo 3. El puerto debe ser 8080
echo.
pause
