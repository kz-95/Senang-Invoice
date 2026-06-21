@echo off
echo === Build APK ===
call npm run build:apk-web
if %errorlevel% neq 0 (echo BUILD FAILED & pause & exit /b 1)
echo.
echo === Sync android ===
call npx cap sync android
if %errorlevel% neq 0 (echo SYNC FAILED & pause & exit /b 1)
echo.
echo === Gradle build ===
cd android
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
call gradlew assembleDebug
if %errorlevel% neq 0 (cd .. & echo GRADLE FAILED & pause & exit /b 1)
cd ..
echo.
echo BUILD SUCCESS. Run install.bat to push to phone.
pause
