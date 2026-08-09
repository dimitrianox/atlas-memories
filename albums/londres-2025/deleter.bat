@echo off
setlocal

if not exist album.json (
    echo ERROR: No se encontro album.json
    pause
    exit /b
)

if not exist media (
    echo ERROR: No se encontro carpeta media
    pause
    exit /b
)

echo.
echo Generando lista de archivos usados por el album...
echo.

powershell -NoProfile -Command ^
"$json = Get-Content 'album.json' -Raw | ConvertFrom-Json; ^
$json.items.relative_path | Set-Content '__album_files.txt'"

echo Archivos que seran eliminados:
echo -----------------------------------

set COUNT=0

for %%F in (media\*) do (
    findstr /ixc:"%%~nxF" "__album_files.txt" >nul
    if errorlevel 1 (
        echo %%~nxF
        set /a COUNT+=1
    )
)

echo -----------------------------------
echo.

choice /M "Eliminar esos archivos"

if errorlevel 2 goto fin

for %%F in (media\*) do (
    findstr /ixc:"%%~nxF" "__album_files.txt" >nul
    if errorlevel 1 (
        del "%%F"
    )
)

echo.
echo Limpieza completada.

:fin
del "__album_files.txt" >nul 2>nul

pause