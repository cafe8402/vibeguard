@echo off
setlocal
cd /d "%~dp0"

set "VIBEGUARD_PORT=3005"
set "VIBEGUARD_PID_FILE=%~dp0.vibeguard-server.pid"
set "VIBEGUARD_OUT_LOG=%~dp0vibeguard-server.log"
set "VIBEGUARD_ERR_LOG=%~dp0vibeguard-server-error.log"

for /f %%P in ('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %VIBEGUARD_PORT% -State Listen -ErrorAction SilentlyContinue ^| Select-Object -First 1 -ExpandProperty OwningProcess"') do set "VIBEGUARD_EXISTING_PID=%%P"
if defined VIBEGUARD_EXISTING_PID (
  echo VibeGuard is already running at http://localhost:%VIBEGUARD_PORT%/
  exit /b 0
)

if not exist "%~dp0node_modules\vite\bin\vite.js" (
  echo Dependencies are missing. Run npm install first.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory '%~dp0' -WindowStyle Hidden -RedirectStandardOutput '%VIBEGUARD_OUT_LOG%' -RedirectStandardError '%VIBEGUARD_ERR_LOG%' -PassThru; Set-Content -LiteralPath '%VIBEGUARD_PID_FILE%' -Value $p.Id -Encoding ascii"

powershell -NoProfile -Command "Start-Sleep -Seconds 3"
for /f %%P in ('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %VIBEGUARD_PORT% -State Listen -ErrorAction SilentlyContinue ^| Select-Object -First 1 -ExpandProperty OwningProcess"') do set "VIBEGUARD_STARTED_PID=%%P"
if not defined VIBEGUARD_STARTED_PID (
  echo VibeGuard failed to start. Check vibeguard-server-error.log.
  exit /b 1
)

echo VibeGuard started: http://localhost:%VIBEGUARD_PORT%/
exit /b 0
