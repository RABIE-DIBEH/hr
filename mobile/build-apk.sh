#!/usr/bin/env bash
# build-apk.sh - Build HRMS Mobile APK
# Requires Flutter SDK installed and available on PATH
set -euo pipefail

echo "=== HRMS Mobile APK Build ==="

# Check Flutter
if ! command -v flutter &>/dev/null; then
  echo "ERROR: Flutter not found. Install from https://flutter.dev"
  exit 1
fi

flutter doctor --short
echo ""

# Get dependencies
echo "→ Getting dependencies..."
flutter pub get

# Run analyzer
echo "→ Running static analysis..."
flutter analyze

# Run tests
echo "→ Running tests..."
flutter test

# Build APK (debug for testing)
echo "→ Building debug APK..."
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:8080/api

echo ""
echo "✅ APK built: build/app/outputs/flutter-apk/app-debug.apk"
echo ""
echo "To build release APK:"
echo "  flutter build apk --release --dart-define=API_BASE_URL=https://your-production-api.com/api"
echo ""
echo "To install on connected device:"
echo "  flutter install"
