@echo off
echo ===== Node.js and HTTP Server Setup Script =====
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please download and install from https://nodejs.org/
    echo After installation, run this script again.
    start https://nodejs.org/en/download/
    pause
    exit
)

:: Check Node.js version
echo Node.js is installed:
node -v
echo.

:: Check if http-server is installed globally
call npm list -g http-server >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing http-server globally...
    call npm install -g http-server
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install http-server. Please check your network connection or npm configuration.
        pause
        exit
    )
    echo http-server installed successfully.
) else (
    echo http-server is already installed.
)
echo.

:: Start http-server in the current directory
echo Starting http-server in the current directory...
start cmd /k "http-server -o"

echo.
echo If the browser doesn't open automatically, navigate to http://localhost:8080
echo To stop the server, close the command prompt window that opened.
echo.
pause