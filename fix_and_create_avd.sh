#!/bin/bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

# Setup cmdline-tools directory structure
mkdir -p "$ANDROID_HOME/cmdline-tools"

# Remove existing 'latest' if it exists
rm -rf "$ANDROID_HOME/cmdline-tools/latest"

# Correct Symlink: 
# Source: /opt/homebrew/share/android-commandlinetools/cmdline-tools/latest
# Target: $ANDROID_HOME/cmdline-tools/latest
ln -s "/opt/homebrew/share/android-commandlinetools/cmdline-tools/latest" "$ANDROID_HOME/cmdline-tools/latest"

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "Using 'latest' avdmanager: $(which avdmanager)"

echo "Attempting to create AVD 'Pixel_6_API_35' (Attempt 4)..."
# Removed --verbose flag which caused error
echo "no" | avdmanager create avd -n Pixel_6_API_35 -k "system-images;android-35;google_apis;arm64-v8a" --device "pixel_6" --force

if [ $? -eq 0 ]; then
    echo "SUCCESS: AVD Created!"
else
    echo "ERROR: Failed to create AVD."
fi
