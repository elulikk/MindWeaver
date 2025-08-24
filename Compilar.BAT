@echo off
:: ========================
:: Script para build .exe con log (pantalla + log)
:: ========================

set LOGFILE=build_log.txt
powershell -Command "Add-Content -Path '%LOGFILE%' -Value '==== INICIO DEL BUILD: %date% %time% ===='"

:: --- Chequear permisos de administrador ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs -WorkingDirectory '%~dp0'"
    exit /b
)

:: --- Ir a la carpeta del proyecto ---
cd /d "%~dp0"

:: --- Chequear archivos necesarios ---
if not exist "main.js" (
    echo main.js no encontrado
    pause
    exit /b
)
if not exist "package.json" (
    echo package.json no encontrado
    pause
    exit /b
)
if not exist "vite.config.js" (
    echo vite.config.js no encontrado
    pause
    exit /b
)

:: --- Instalar dependencias ---
powershell -Command "npm install --save-dev @vitejs/plugin-react electron electron-packager electron-builder | Tee-Object -FilePath '%LOGFILE%' -Append"

:: --- Ejecutar build ---
powershell -Command "npm run build | Tee-Object -FilePath '%LOGFILE%' -Append"

:: --- Ejecutar package:win ---
powershell -Command "npx electron-packager . mind-weaver --platform=win32 --arch=x64 --out=build --overwrite --asar | Tee-Object -FilePath '%LOGFILE%' -Append"

powershell -Command "Add-Content -Path '%LOGFILE%' -Value '==== FIN DEL BUILD: %date% %time% ===='"

pause
