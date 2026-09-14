@echo off
chcp 65001 > nul
title DigiTeca - Subida Turbo a GitHub Releases
color 0b

echo ====================================================================
echo        DIGITECA - SUBIDA TURBO A GITHUB RELEASES (10 HILOS)
echo ====================================================================
echo  Destino: https://github.com/andresrodriguez750-max/digiteca-libros
echo.
echo  Optimizaciones activas:
echo   - 10 conexiones simultaneas en paralelo.
echo   - Subida directa sin frenar tu procesador.
echo   - Base de datos sincronizada en segundo plano.
echo   - Borrado automatico de la PC para recuperar espacio en disco.
echo ====================================================================
echo.
echo  1. Subir un lote de 25 libros
echo  2. Subir un lote de 100 libros
echo  3. Subir TODOS los libros de la PC a maxima velocidad
echo  4. Salir
echo.
set /p op="Elige una opcion (1-4): "

if "%op%"=="1" (
    echo.
    echo Iniciando subida de 25 libros a 10 hilos...
    python scripts\upload_local_libros_to_github.py --limit 25 --threads 10
    goto fin
)

if "%op%"=="2" (
    echo.
    echo Iniciando subida de 100 libros a 10 hilos...
    python scripts\upload_local_libros_to_github.py --limit 100 --threads 10
    goto fin
)

if "%op%"=="3" (
    echo.
    echo Iniciando subida TURBO de TODOS los libros a 10 hilos...
    python scripts\upload_local_libros_to_github.py --threads 10
    goto fin
)

if "%op%"=="4" (
    exit
)

:fin
echo.
echo ====================================================================
echo Proceso finalizado. Espacio liberado en tu PC.
echo ====================================================================
pause
