#!/bin/bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:/opt/homebrew/bin"

mkdir -p "$ANDROID_HOME"

echo "Installing SDK components..."
yes | sdkmanager --sdk_root="$ANDROID_HOME" --verbose "platform-tools" "platforms;android-35" "system-images;android-35;google_apis;arm64-v8a" "emulator" "build-tools;35.0.0"

echo "Creating AVD..."
# 'no' to custom hardware profile prompt
echo "no" | avdmanager create avd -n Pixel_6_API_35 -k "system-images;android-35;google_apis;arm64-v8a" --device "pixel_6" --force

echo "Setup Complete."
