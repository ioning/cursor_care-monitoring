#!/bin/bash

# Script to generate Android release keystore

set -e

KEYSTORE_PATH="android/app/release.keystore"
KEYSTORE_ALIAS="care-monitoring-release"

echo "🔐 Generating Android release keystore..."

if [ -f "$KEYSTORE_PATH" ]; then
    echo "⚠️  Keystore already exists at $KEYSTORE_PATH"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
    rm "$KEYSTORE_PATH"
fi

keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE_PATH" \
    -alias "$KEYSTORE_ALIAS" -keyalg RSA -keysize 2048 -validity 10000

echo "✅ Keystore generated successfully!"
echo "📝 Add these to android/gradle.properties:"
echo ""
echo "MYAPP_RELEASE_STORE_FILE=release.keystore"
echo "MYAPP_RELEASE_KEY_ALIAS=$KEYSTORE_ALIAS"
echo "MYAPP_RELEASE_STORE_PASSWORD=<your-store-password>"
echo "MYAPP_RELEASE_KEY_PASSWORD=<your-key-password>"



# Script to generate Android release keystore

set -e

KEYSTORE_PATH="android/app/release.keystore"
KEYSTORE_ALIAS="care-monitoring-release"

echo "🔐 Generating Android release keystore..."

if [ -f "$KEYSTORE_PATH" ]; then
    echo "⚠️  Keystore already exists at $KEYSTORE_PATH"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
    rm "$KEYSTORE_PATH"
fi

keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE_PATH" \
    -alias "$KEYSTORE_ALIAS" -keyalg RSA -keysize 2048 -validity 10000

echo "✅ Keystore generated successfully!"
echo "📝 Add these to android/gradle.properties:"
echo ""
echo "MYAPP_RELEASE_STORE_FILE=release.keystore"
echo "MYAPP_RELEASE_KEY_ALIAS=$KEYSTORE_ALIAS"
echo "MYAPP_RELEASE_STORE_PASSWORD=<your-store-password>"
echo "MYAPP_RELEASE_KEY_PASSWORD=<your-key-password>"







