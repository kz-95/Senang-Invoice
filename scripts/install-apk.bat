@echo off
setlocal
cd /d "%~dp0\.."

set ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe

if not exist "%ADB%" (
    echo ERROR: adb.exe not found at %ADB%
    echo Install Android SDK Platform Tools first.
    pause
    exit /b 1
)

:: Find APK
set APK=
if exist "android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk" (
    set APK=android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk
)
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    set APK=android\app\build\outputs\apk\debug\app-debug.apk
)

if "%APK%"=="" (
    echo ERROR: No APK found. Run build-apk.bat first.
    pause
    exit /b 1
)

echo APK: %APK%

:: Check device
"%ADB%" devices 2>nul | findstr "device$" >nul
if errorlevel 1 (
    echo ERROR: No device connected. Plug in phone + enable USB debugging.
    pause
    exit /b 1
)

echo Installing...
"%ADB%" install -r "%APK%"
if errorlevel 1 (
    echo.
    echo TIP: On Xiaomi, accept the install prompt on your phone screen.
    echo Retrying...
    "%ADB%" install -r "%APK%"
)

echo.
echo Done! Open Senang Inv on your phone.
