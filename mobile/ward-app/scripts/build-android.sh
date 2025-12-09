#!/bin/bash

# Build script for Android APK

set -e

echo "🔨 Building Android APK..."

cd android

# Clean previous builds
./gradlew clean

# Build release APK
./gradlew assembleRelease

echo "✅ APK built successfully!"
echo "📦 APK location: android/app/build/outputs/apk/release/app-release.apk"

cd ..



# Build script for Android APK

set -e

echo "🔨 Building Android APK..."

cd android

# Clean previous builds
./gradlew clean

# Build release APK
./gradlew assembleRelease

echo "✅ APK built successfully!"
echo "📦 APK location: android/app/build/outputs/apk/release/app-release.apk"

cd ..







