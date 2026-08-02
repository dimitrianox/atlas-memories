@echo off
title Atlas Memories - Estructura Inicial

echo.
echo ==========================================
echo   Creando estructura de Atlas Memories...
echo ==========================================
echo.

:: Crear carpetas
mkdir assets 2>nul
mkdir docs 2>nul
mkdir cities 2>nul
mkdir cities\london 2>nul
mkdir cities\london\media 2>nul

:: Crear archivos principales
if not exist index.html type nul > index.html
if not exist style.css type nul > style.css
if not exist app.js type nul > app.js
if not exist manifest.json type nul > manifest.json

:: Crear README solo si no existe
if not exist README.md (
(
echo # Atlas Memories
echo.
echo Proyecto de recuerdos interactivos mediante NFC.
echo.
echo Estado: Desarrollo.
) > README.md
)

:: Crear .gitkeep para mantener carpetas vacías
if not exist assets\.gitkeep type nul > assets\.gitkeep
if not exist docs\.gitkeep type nul > docs\.gitkeep
if not exist cities\london\media\.gitkeep type nul > cities\london\media\.gitkeep

echo.
echo ==========================================
echo     ESTRUCTURA CREADA CORRECTAMENTE
echo ==========================================
echo.

pause