@echo off
title DigiTeca - Servidor y Base de Datos CockroachDB
color 0B
chcp 65001 >nul

echo ================================================================
echo               INICIANDO SISTEMA DIGITECA
echo        Escuela Tecnica N 29 DE 6 - Reconquista
echo ================================================================
echo.

:: 1. Verificar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Node.js desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verificar dependencias
if not exist "node_modules\" (
    echo [INFO] Instalando dependencias de Node.js...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Hubo un problema instalando las dependencias.
        pause
        exit /b 1
    )
)

:: 3. Verificar archivo .env
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creando archivo .env desde la plantilla .env.example...
        copy .env.example .env >nul
    )
)

echo.
echo [1/2] Conectando con la base de datos CockroachDB...
echo [2/2] Iniciando servidor Express en puerto 3000...
echo.
echo ================================================================
echo  La aplicacion estara disponible en: http://localhost:3000
echo  Para detener el servidor presiona Ctrl + C en esta ventana.
echo ================================================================
echo.

:: 4. Abrir automaticamente en el navegador predeterminado despues de 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: 5. Iniciar servidor Express
node server.js

pause
