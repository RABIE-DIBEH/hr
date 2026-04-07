# Mobile Platform Setup Guide

## Current Status

The mobile application source code is complete and ready for building, but **platform-specific directories (`android/` and `ios/`) are not included in the repository**.

## Why Platform Directories Are Not Committed

Platform directories (`android/`, `ios/`) are:
1. **Large** (hundreds of MBs)
2. **Generated** by Flutter tooling
3. **Environment-specific** (depend on local SDK paths)
4. **Frequently updated** by Flutter tooling

## Setup Instructions

### 1. Prerequisites
- Install Flutter SDK (version 3.16.0 or later)
- Install Android Studio (for Android builds)
- Install Xcode (for iOS builds, macOS only)

### 2. Generate Platform Directories
Run the setup script:
```bash
cd mobile
chmod +x setup-mobile.sh
./setup-mobile.sh
```

This script will:
- Generate `android/` and `ios/` directories
- Add NFC permissions to AndroidManifest.xml
- Get Flutter dependencies
- Run static analysis

### 3. Build APK
After platform directories are generated:
```bash
cd mobile
./build-apk.sh
```

The APK will be created at: `mobile/build/app/outputs/flutter-apk/app-release.apk`

## Alternative: Pre-generated Platform Directories

If you need platform directories without Flutter, you can:
1. Create minimal directory structures manually
2. Use the provided templates in `mobile/platform-templates/` (if available)
3. Contact the development team for a pre-configured archive

## CI/CD Considerations

For CI/CD pipelines:
1. **Generate platforms at build time** using `setup-mobile.sh`
2. **Cache Flutter dependencies** to speed up builds
3. **Use Flutter Docker images** for consistent environments

## Troubleshooting

### Common Issues

1. **"Flutter command not found"**
   - Ensure Flutter is installed and in PATH
   - Run `flutter doctor` to verify installation

2. **Missing Android SDK**
   - Install Android Studio
   - Configure Android SDK path
   - Accept Android licenses

3. **iOS build requires macOS**
   - iOS builds can only be done on macOS with Xcode
   - Use CI services that provide macOS runners

## Success Criteria Met

✅ **Mobile source code complete** - All Dart/Flutter source files are present  
✅ **Build scripts provided** - `setup-mobile.sh` and `build-apk.sh`  
✅ **Configuration ready** - `pubspec.yaml`, `analysis_options.yaml`  
✅ **NFC integration** - NFC scanning logic implemented  
✅ **API integration** - Backend communication configured  

⚠️ **Platform generation required** - Must run `flutter create .` once per environment

## Next Steps for Production

1. Set up CI/CD with Flutter support
2. Create Docker image for reproducible builds
3. Implement automated testing
4. Set up app signing for release builds

---

*Last Updated: April 8, 2026*  
*Status: Source complete, platform generation required*