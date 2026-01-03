#!/bin/bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:/opt/homebrew/bin"

MAX_RETRIES=20
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    echo "Attempt $((COUNT+1)) to download System Image..."
    # Try to install system image
    yes | sdkmanager --sdk_root="$ANDROID_HOME" "system-images;android-35;google_apis;arm64-v8a"
    
    if [ $? -eq 0 ]; then
        echo "Download Successful!"
        
        # If download works, try to create AVD
        echo "Creating AVD..."
        echo "no" | avdmanager create avd -n Pixel_6_API_35 -k "system-images;android-35;google_apis;arm64-v8a" --device "pixel_6" --force
        
        if [ $? -eq 0 ]; then
            echo "AVD Created Successfully. Exiting."
            exit 0
        fi
    fi
    
    echo "Download failed. Waiting 10 seconds before retry..."
    sleep 10
    COUNT=$((COUNT+1))
done

echo "Failed after $MAX_RETRIES attempts."
exit 1
