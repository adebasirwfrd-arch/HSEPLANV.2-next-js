#!/bin/bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

AVDMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"

echo "Using avdmanager at: $AVDMANAGER"
$AVDMANAGER list avd

echo "Attempting to create AVD 'Pixel_6_API_35' (Attempt 2)..."
echo "no" | $AVDMANAGER create avd -n Pixel_6_API_35 -k "system-images;android-35;google_apis;arm64-v8a" --device "pixel_6" --force --verbose

if [ $? -eq 0 ]; then
    echo "SUCCESS: AVD Created!"
else
    echo "ERROR: Failed to create AVD."
fi
