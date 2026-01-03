#!/bin/bash
export ANDROID_HOME="$HOME/Library/Android/sdk"

# Define Paths
AVD_NAME="Pixel_6_API_35"
AVD_DIR="$HOME/.android/avd/${AVD_NAME}.avd"
INI_FILE="$HOME/.android/avd/${AVD_NAME}.ini"

echo "Manually creating AVD: $AVD_NAME"

# Create Directory
mkdir -p "$AVD_DIR"
mkdir -p "$HOME/.android/avd"

# Create .ini file
cat > "$INI_FILE" <<EOF
avd.ini.encoding=UTF-8
path=$AVD_DIR
path.rel=avd/${AVD_NAME}.avd
target=android-35
EOF

# Create config.ini
# Critical: image.sysdir.1 must be relative to ANDROID_HOME
cat > "$AVD_DIR/config.ini" <<EOF
PlayStore.enabled=false
abi.type=arm64-v8a
avd.ini.encoding=UTF-8
disk.dataPartition.size=6G
hw.accelerometer=yes
hw.audioInput=yes
hw.battery=yes
hw.camera.back=virtualscene
hw.camera.front=emulated
hw.cpu.arch=arm64
hw.cpu.ncore=4
hw.device.manufacturer=Google
hw.device.name=pixel_6
hw.gps=yes
hw.gpu.enabled=yes
hw.gpu.mode=auto
hw.initialOrientation=Portrait
hw.keyboard=yes
hw.lcd.density=420
hw.lcd.height=2400
hw.lcd.width=1080
hw.mainKeys=no
hw.ramSize=4096
hw.sdCard=yes
hw.sensors.orientation=yes
hw.sensors.proximity=yes
image.sysdir.1=system-images/android-35/google_apis/arm64-v8a/
tag.display=Google APIs
tag.id=google_apis
vm.heapSize=512
EOF

# Create userdata.img (required for first boot?) 
# Usually emulator creates it. But we verified system-images has userdata.img or empty_data_disk.

echo "AVD Configured manually."
