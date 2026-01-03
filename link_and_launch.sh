#!/bin/bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

# Find Caskroom path (assuming version subfolder exists)
PLATFORM_TOOLS_SOURCE=$(ls -d /opt/homebrew/Caskroom/android-platform-tools/* | head -n 1)/platform-tools

echo "Source: $PLATFORM_TOOLS_SOURCE"

if [ ! -d "$PLATFORM_TOOLS_SOURCE" ]; then
    echo "ERROR: Could not find platform-tools in Caskroom. Trying /opt/homebrew/share..."
    # Fallback to verify if it's elsewhere
    PLATFORM_TOOLS_SOURCE="/opt/homebrew/share/android-platform-tools" 
fi

# Remove existing (broken?) platform-tools
rm -rf "$ANDROID_HOME/platform-tools"

# Create Symlink
ln -s "$PLATFORM_TOOLS_SOURCE" "$ANDROID_HOME/platform-tools"

echo "Linked platform-tools to $ANDROID_HOME/platform-tools"

# Launch Emulator
echo "Launching Emulator..."
export PATH="$ANDROID_HOME/platform-tools:$PATH"
nohup $ANDROID_HOME/emulator/emulator -avd Pixel_6_API_35 -no-boot-anim -netdelay none -netspeed full > emulator_final.log 2>&1 &
echo "Emulator PID: $!"
