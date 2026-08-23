#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
#  Chaos Realm – Full APK Build Script
# ═══════════════════════════════════════════════════════
set -e

NODE_URL="https://nodejs.org/dist/v20.17.0/node-v20.17.0-darwin-x64.tar.gz"
JAVA_URL="https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_macos-x64_bin.tar.gz"
SDK_URL="https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"

WORK_DIR="/tmp/cr_build"
NODE_DIR="$WORK_DIR/node"
JAVA_HOME_DIR="$WORK_DIR/jdk/Contents/Home"
ANDROID_SDK="$WORK_DIR/android-sdk"
GAME_DIR="/Users/khalidabdullah/AntiGravity/chaos-realm"

mkdir -p "$WORK_DIR" "$NODE_DIR" "$WORK_DIR/jdk" "$ANDROID_SDK/cmdline-tools"

echo "=========================================="
echo " STEP 1: Download & setup Node.js"
echo "=========================================="
curl -fsSL "$NODE_URL" -o "$WORK_DIR/node.tar.gz"
tar -xzf "$WORK_DIR/node.tar.gz" -C "$NODE_DIR" --strip-components=1
export PATH="$NODE_DIR/bin:$PATH"
node --version
npm --version
echo "✅ Node ready"

echo "=========================================="
echo " STEP 2: Download & setup Java 17"
echo "=========================================="
curl -fsSL "$JAVA_URL" -o "$WORK_DIR/jdk.tar.gz"
tar -xzf "$WORK_DIR/jdk.tar.gz" -C "$WORK_DIR/jdk" --strip-components=1
# Find java binary
JAVA_BIN=$(find "$WORK_DIR/jdk" -name "java" -type f 2>/dev/null | head -1)
JAVA_HOME_DIR=$(dirname "$(dirname "$JAVA_BIN")")
export JAVA_HOME="$JAVA_HOME_DIR"
export PATH="$JAVA_HOME/bin:$PATH"
java --version
echo "✅ Java ready"

echo "=========================================="
echo " STEP 3: Download Android SDK cmdline-tools"
echo "=========================================="
curl -fsSL "$SDK_URL" -o "$WORK_DIR/cmdtools.zip"
unzip -q "$WORK_DIR/cmdtools.zip" -d "$ANDROID_SDK/cmdline-tools/"
mv "$ANDROID_SDK/cmdline-tools/cmdline-tools" "$ANDROID_SDK/cmdline-tools/latest" 2>/dev/null || true
export ANDROID_SDK_ROOT="$ANDROID_SDK"
export PATH="$ANDROID_SDK/cmdline-tools/latest/bin:$ANDROID_SDK/platform-tools:$PATH"
echo "✅ SDK tools ready"

echo "=========================================="
echo " STEP 4: Accept licenses & install SDK components"
echo "=========================================="
yes | sdkmanager --sdk_root="$ANDROID_SDK" --licenses > /dev/null 2>&1 || true
sdkmanager --sdk_root="$ANDROID_SDK" "platform-tools" "platforms;android-34" "build-tools;34.0.0" 2>&1 | tail -5
echo "✅ Android SDK components installed"

echo "=========================================="
echo " STEP 5: Capacitor setup & sync"
echo "=========================================="
cd "$GAME_DIR"

# Rebuild www
mkdir -p www
cp index.html style.css game.js manifest.json sw.js www/ 2>/dev/null || true
cp -r icons www/ 2>/dev/null || true

# Install capacitor if not already
if [ ! -d "node_modules/@capacitor" ]; then
  npm install @capacitor/core@5 @capacitor/cli@5 @capacitor/android@5 2>&1 | tail -5
fi

# Sync
npx cap sync android 2>&1 | tail -5
echo "✅ Capacitor synced"

echo "=========================================="
echo " STEP 6: Build APK with Gradle"
echo "=========================================="
cd "$GAME_DIR/android"
export ANDROID_SDK_ROOT="$ANDROID_SDK"
export JAVA_HOME="$JAVA_HOME_DIR"

chmod +x gradlew
./gradlew assembleDebug --no-daemon 2>&1 | tail -20

APK_PATH="$GAME_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  cp "$APK_PATH" "$GAME_DIR/ChaosRealm.apk"
  echo ""
  echo "=========================================="
  echo " ✅ APK BUILT SUCCESSFULLY!"
  echo " 📦 $GAME_DIR/ChaosRealm.apk"
  ls -lh "$GAME_DIR/ChaosRealm.apk"
  echo "=========================================="
else
  echo "❌ APK not found — build may have failed"
  exit 1
fi
