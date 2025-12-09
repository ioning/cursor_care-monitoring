#!/bin/bash

# Build script for iOS

set -e

echo "🍎 Building iOS app..."

cd ios

# Install pods
pod install

# Build for device (requires Xcode)
echo "📱 To build for iOS device, open ios/CareMonitoringWard.xcworkspace in Xcode"
echo "   and use Product > Archive to create an IPA file"

cd ..



# Build script for iOS

set -e

echo "🍎 Building iOS app..."

cd ios

# Install pods
pod install

# Build for device (requires Xcode)
echo "📱 To build for iOS device, open ios/CareMonitoringWard.xcworkspace in Xcode"
echo "   and use Product > Archive to create an IPA file"

cd ..







