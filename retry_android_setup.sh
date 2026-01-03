#!/bin/bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:/opt/homebrew/bin"

echo "Retrying System Image Download..."
# Install only the system image
yes | sdkmanager --sdk_root="$ANDROID_HOME" --verbose "system-images;android-35;google_apis;arm64-v8a"

echo "Creating AVD..."
# Create the AVD again
echo "no" | avdmanager create avd -n Pixel_6_API_35 -k "system-images;android-35;google_apis;arm64-v8a" --device "pixel_6" --force

echo "Retry Complete."
