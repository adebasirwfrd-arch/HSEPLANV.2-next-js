#!/bin/bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

echo "Checking installed packages..."
sdkmanager --sdk_root="$ANDROID_HOME" --list_installed

echo "Checking system images specificially:"
ls -F "$ANDROID_HOME/system-images/android-35/google_apis/arm64-v8a/"
