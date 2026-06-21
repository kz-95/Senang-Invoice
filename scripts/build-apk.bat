@echo off
setlocal
cd /d "%~dp0\.."
echo.

echo === Building Senang Inv APK ===
echo.

echo Step 0/4: Compile Node.js services...
call node scripts\build-node.mjs
if %errorlevel% neq 0 ( echo BUILD FAILED - service compilation; pause; exit /b 1 )
echo.

echo Step 1/4: Stash API routes...
if exist "src\app\_api_stashed" rmdir /s /q "src\app\_api_stashed" 2>nul
if not exist "src\app\_api_stashed" (
    xcopy "src\app\api" "src\app\_api_stashed" /e /i /q /y >nul 2>&1
    rmdir /s /q "src\app\api" 2>nul
    if exist "src\app\api" (
        echo ERROR: Could not remove api directory. Retrying...
        timeout /t 2 /nobreak >nul
        rmdir /s /q "src\app\api" 2>nul
        if exist "src\app\api" (
            echo ERROR: File still locked. Close VS Code and retry.
            rmdir /s /q "src\app\_api_stashed" 2>nul
            pause
            exit /b 1
        )
    )
)
echo   OK - API stashed

echo Step 2/4: Next.js static export...
if exist ".next" rmdir /s /q ".next"
if exist "out" rmdir /s /q "out"
set BUILD_TARGET=apk
call npx next build
if errorlevel 1 (
    echo.
    echo BUILD FAILED - restoring API...
    if exist "src\app\_api_stashed" (
        xcopy "src\app\_api_stashed" "src\app\api" /e /i /q /y >nul 2>&1
        rmdir /s /q "src\app\_api_stashed" 2>nul
    )
    pause
    exit /b 1
)
echo   OK - Build complete

echo Step 3/4: Restore API ^& clean...
if exist "src\app\_api_stashed" (
    xcopy "src\app\_api_stashed" "src\app\api" /e /i /q /y >nul 2>&1
    rmdir /s /q "src\app\_api_stashed" 2>nul
)
del /q "out\sw.js" "out\workbox-*.js" "out\manifest.json" 2>nul
if exist "out\nodejs" rmdir /s /q "out\nodejs"
xcopy "nodejs" "out\nodejs" /e /i /q >nul
echo   OK

echo Step 4/4: Capacitor sync + Gradle build...
call npx cap sync android
if errorlevel 1 (
    echo Sync failed.
    pause
    exit /b 1
)

cd android
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
call gradlew assembleDebug
if errorlevel 1 (
    cd ..
    echo Gradle build failed.
    pause
    exit /b 1
)
cd ..

echo.
echo === APK built! ===
echo Running install...
call "%~dp0\install-apk.bat"
echo.
echo Step 5/5: Clean build cache for dev...
echo   (This lets you run npm run dev without errors)
if exist ".next" rmdir /s /q ".next"
if exist "out" rmdir /s /q "out"
echo   OK - ready for dev
