@echo off
setlocal
cd /d "%~dp0"

set "VIBEGUARD_PORT=3005"
set "VIBEGUARD_PID_FILE=%~dp0.vibeguard-server.pid"

if not exist "%VIBEGUARD_PID_FILE%" (
  echo No VibeGuard PID file was found. The server may already be stopped.
  exit /b 0
)

set /p VIBEGUARD_PID=<"%VIBEGUARD_PID_FILE%"
echo %VIBEGUARD_PID%| findstr /r "^[0-9][0-9]*$" >nul
if errorlevel 1 (
  echo The PID file is invalid. Stop was cancelled.
  exit /b 1
)

taskkill /PID %VIBEGUARD_PID% /T /F >nul 2>&1
if errorlevel 1 (
  echo The saved process was not running.
)

del /q "%VIBEGUARD_PID_FILE%" >nul 2>&1
echo VibeGuard stopped.
exit /b 0
