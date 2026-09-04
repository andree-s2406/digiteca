@echo off
title CockroachDB Local - DigiTeca
color 0A
chcp 65001 >nul

echo ================================================================
echo           INICIANDO NODO LOCAL DE COCKROACHDB
echo ================================================================
echo.

where cockroach >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ADVERTENCIA] El comando 'cockroach' no se encontro en el PATH.
    echo Si descargaste CockroachDB, asegurate de tenerlo en tu PATH o
    echo usar la conexion de CockroachDB Cloud en el archivo .env.
    echo.
    pause
    exit /b 1
)

echo [INFO] Iniciando nodo individual de CockroachDB en puerto 26257...
echo [INFO] Base de datos: digiteca
echo.
cockroach start-single-node --insecure --listen-addr=localhost:26257 --http-addr=localhost:8080

pause
