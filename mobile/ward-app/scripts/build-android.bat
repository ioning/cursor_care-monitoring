@echo off
REM Build script for Android APK (Windows)

echo Building Android APK...

cd android

REM Clean previous builds
call gradlew.bat clean

REM Build release APK
call gradlew.bat assembleRelease

echo APK built successfully!
echo APK location: android\app\build\outputs\apk\release\app-release.apk

cd ..

pause


REM Build script for Android APK (Windows)

echo Building Android APK...

cd android

REM Clean previous builds
call gradlew.bat clean

REM Build release APK
call gradlew.bat assembleRelease

echo APK built successfully!
echo APK location: android\app\build\outputs\apk\release\app-release.apk

cd ..

pause







