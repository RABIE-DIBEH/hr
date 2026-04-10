# HRMS Mobile - Flutter NFC Application

## Overview
The HRMS mobile application is a Flutter-based Android/iOS app for NFC-based attendance tracking. It provides employees with a convenient way to clock in/out using NFC cards, with offline support and professional user feedback.

## 📱 Features

### Phase 9 Enhancements (Completed)
1. **High-Fidelity NFC Feedback**
   - Full-screen success animation (Green checkmark)
   - Full-screen failure animation (Red "X")
   - Vibration feedback (subtle for success, aggressive for failure)
   - Professional visual design with gradients

2. **Intelligent Scanning Logic**
   - Anti-Double-Tap protection (5-minute cooldown)
   - Duplicate scan confirmation dialog
   - Automatic session timeout (10 seconds)

3. **Connectivity Resilience**
   - Offline caching using `shared_preferences`
   - Automatic retry when network is restored
   - Pending scans counter in UI
   - Manual sync button for offline records

4. **Professional UX**
   - Animated loading states
   - Gradient backgrounds
   - Responsive design for all screen sizes
   - Arabic/English support

## 🏗️ Architecture

```
mobile/
├── lib/
│   ├── screens/              # Application Screens
│   │   ├── nfc_clock_screen.dart      # Main NFC scanning (Phase 9 enhanced)
│   │   ├── login_screen.dart          # Authentication
│   │   ├── dashboard_screen.dart      # Employee dashboard
│   │   ├── attendance_history_screen.dart
│   │   ├── leave_request_screen.dart
│   │   └── ... (other screens)
│   ├── services/             # Business Logic & API
│   │   ├── nfc_service.dart           # NFC operations (Phase 9 enhanced)
│   │   ├── api_service.dart           # HTTP client with auth
│   │   ├── auth_service.dart          # Authentication management
│   │   └── ... (other services)
│   ├── models/               # Data Models
│   │   ├── employee.dart
│   │   ├── attendance.dart
│   │   └── ... (other models)
│   ├── widgets/              # Reusable UI Components
│   │   ├── custom_app_bar.dart
│   │   ├── loading_indicator.dart
│   │   └── ... (other widgets)
│   ├── config/               # Configuration
│   │   └── env_config.dart   # Environment variables
│   └── main.dart             # Application entry point
├── android/                  # Android platform code (generated)
├── ios/                      # iOS platform code (generated)
├── pubspec.yaml              # Flutter dependencies
├── setup-mobile.sh           # Platform generation script
├── build-apk.sh              # APK build script
└── PLATFORM_SETUP.md         # Platform setup instructions
```

## 🔧 Phase 9 Implementation Details

### NFC Clock Screen (`nfc_clock_screen.dart`)
```dart
// Key Phase 9 Features:
1. Full-screen result states (success/failure)
2. Vibration feedback with different patterns
3. Anti-double-tap logic with 5-minute cooldown
4. Offline scan caching and sync
5. Professional gradient UI design
```

### NFC Service (`nfc_service.dart`)
```dart
// Key Phase 9 Features:
1. Offline caching with shared_preferences
2. Automatic scan saving when network fails
3. Sync functionality for pending scans
4. Network timeout handling (5 seconds)
5. Error recovery and retry logic
```

## 🚀 Getting Started

### Prerequisites
- Flutter SDK 3.16.0+
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Platform Generation
```bash
# Generate platform directories (android/, ios/)
cd mobile
chmod +x setup-mobile.sh
./setup-mobile.sh
```

### Development
```bash
# Run in development mode
flutter run

# Run on specific device
flutter run -d <device_id>

# Run tests
flutter test

# Analyze code
flutter analyze
```

### Build APK
```bash
# Build release APK
./build-apk.sh
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Custom API URL
```bash
# Build with custom API endpoint
flutter build apk --dart-define=API_BASE_URL=https://your-api.com/api
```

## 📱 Screens

### 1. NFC Clock Screen
- **Purpose**: NFC-based attendance recording
- **Features**:
  - NFC tag detection and UID reading
  - Full-screen success/failure animations
  - Vibration feedback (haptic)
  - Offline caching with sync
  - Anti-double-tap protection
- **Flow**: Scan → Process → Success/Failure → Redirect

### 2. Login Screen
- **Purpose**: User authentication
- **Features**: Email/password form, JWT token storage

### 3. Dashboard Screen
- **Purpose**: Employee overview
- **Features**: Attendance summary, leave balance, quick actions

### 4. Attendance History
- **Purpose**: View attendance records
- **Features**: Date filtering, status indicators

### 5. Leave Request
- **Purpose**: Submit leave requests
- **Features**: Date picker, type selection, reason input

## 🔌 API Integration

### Service Architecture
- **Dio**: HTTP client with interceptors
- **JWT Authentication**: Automatic token injection
- **Error Handling**: Centralized error processing
- **Response Wrapping**: Automatic unwrapping of API responses

### NFC Service (`nfc_service.dart`)
```dart
class NfcService {
  // Phase 9: Offline caching key
  static const String _offlineScansKey = 'offline_nfc_scans';
  
  Future<Map<String, dynamic>> clockByNfc(String cardUid) async {
    try {
      // Attempt API call with timeout
      final response = await _apiService.dio.post(
        '/attendance/nfc-clock',
        data: {'cardUid': cardUid},
      ).timeout(const Duration(seconds: 5));
      
      return {'ok': true, 'message': 'Attendance recorded.', 'offline': false};
    } on DioException catch (e) {
      // Phase 9: Network failure detection
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        await _saveOfflineScan(cardUid); // Save for later sync
        return {
          'ok': true,
          'message': 'Saved offline. Will sync when back online.',
          'offline': true,
        };
      }
      // ... error handling
    }
  }
  
  // Phase 9: Offline scan management
  Future<void> _saveOfflineScan(String cardUid) async {
    final prefs = await SharedPreferences.getInstance();
    final scans = prefs.getStringList(_offlineScansKey) ?? [];
    final scanData = jsonEncode({
      'cardUid': cardUid,
      'timestamp': DateTime.now().toIso8601String(),
    });
    scans.add(scanData);
    await prefs.setStringList(_offlineScansKey, scans);
  }
  
  Future<int> syncOfflineScans() async {
    // Sync all pending offline scans
    final prefs = await SharedPreferences.getInstance();
    final scans = prefs.getStringList(_offlineScansKey) ?? [];
    // ... sync logic with retry
  }
}
```

## 🎨 UI/UX Design

### Visual Design
- **Theme**: Dark gradient theme with blue/black gradients
- **Animations**: Fade, scale, and slide transitions
- **Feedback**: Visual, haptic, and auditory (vibration)
- **Loading States**: Animated progress indicators

### NFC Scanning Experience
1. **Ready State**: Gradient background with NFC icon
2. **Scanning**: Animated circular progress
3. **Processing**: Sync icon with "Processing..." text
4. **Result**: Full-screen color-coded result
   - **Success**: Green background with checkmark
   - **Failure**: Red background with X icon
5. **Auto-redirect**: Success redirects after 3 seconds

### Offline Indicators
- **Pending Count**: Orange badge showing offline scans
- **Sync Button**: Manual sync trigger
- **Status Messages**: "Saved offline" notifications

## 🔒 Security

### Implemented Security
1. **JWT Token Storage**: Secure storage with `flutter_secure_storage`
2. **Token Refresh**: Automatic token injection via Dio interceptors
3. **Unauthorized Handling**: Automatic logout on 401 responses
4. **Input Validation**: Form validation for user inputs
5. **Network Security**: HTTPS-only API communication

### NFC Security
- **UID Validation**: Server-side card validation
- **Session Timeout**: 10-second scan timeout
- **Duplicate Prevention**: 5-minute cooldown between scans
- **Error Handling**: Graceful failure with user feedback

## 📦 Dependencies

### Core Dependencies
- **flutter**: UI framework
- **dio**: HTTP client
- **provider**: State management
- **nfc_manager**: NFC tag reading
- **shared_preferences**: Local storage (Phase 9)
- **vibration**: Haptic feedback (Phase 9)
- **flutter_secure_storage**: Secure token storage
- **intl**: Internationalization
- **jwt_decoder**: JWT token parsing

### Development Dependencies
- **flutter_test**: Testing framework
- **flutter_lints**: Code linting
- **mockito**: Mocking framework
- **build_runner**: Code generation

## 🧪 Testing

### Test Commands
```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/nfc_service_test.dart

# Run with coverage
flutter test --coverage
```

### Test Structure
- **Unit Tests**: Service layer testing
- **Widget Tests**: UI component testing
- **Integration Tests**: End-to-end flow testing

### Mocking
- **NFC Hardware**: Mock NFC manager for testing
- **API Calls**: Mock Dio responses
- **Local Storage**: Mock shared preferences

## 🔧 Configuration

### Environment Configuration (`env_config.dart`)
```dart
class EnvConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api', // Android emulator
  );
}
```

### Build Configuration
```bash
# Development build
flutter build apk --debug

# Release build
flutter build apk --release

# Custom API URL
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com/api
```

## 🐛 Troubleshooting

### Common Issues

1. **NFC Not Working**
   ```bash
   # Check NFC availability
   flutter run -d <device_id>
   # Verify device has NFC hardware
   # Check AndroidManifest.xml permissions
   ```

2. **Build Failures**
   ```bash
   # Clean build
   flutter clean
   # Get dependencies
   flutter pub get
   # Regenerate platform files
   ./setup-mobile.sh
   ```

3. **API Connection Issues**
   - Verify backend is running
   - Check API_BASE_URL configuration
   - Test with Postman/curl
   - Check network permissions in AndroidManifest.xml

4. **Platform Generation Issues**
   - Run `flutter doctor` to check setup
   - Ensure Flutter SDK is in PATH
   - Check Android Studio/Xcode installation

### Debugging Tips
1. **Logs**: Use `print()` or `debugPrint()` for debugging
2. **Hot Reload**: `r` in terminal during `flutter run`
3. **Hot Restart**: `R` in terminal for full restart
4. **DevTools**: `flutter run --debug` for DevTools access

## 📱 Platform-Specific Notes

### Android
- **Minimum SDK**: API 21 (Android 5.0)
- **NFC Permissions**: Automatically configured
- **Emulator**: Use `10.0.2.2` for localhost backend

### iOS
- **Requirements**: Physical device for NFC testing
- **Entitlements**: NFC capability enabled
- **Info.plist**: NFC usage description added

### Platform Generation
Platform directories (`android/`, `ios/`) are not committed because:
1. Large file size (100+ MB)
2. Environment-specific paths
3. Generated by Flutter tooling
4. Frequently updated

Use `setup-mobile.sh` to generate them when needed.

## 🔄 Deployment

### APK Build Process
```bash
# 1. Generate platform directories (if missing)
./setup-mobile.sh

# 2. Build release APK
./build-apk.sh

# 3. APK location
# build/app/outputs/flutter-apk/app-release.apk
```

### App Bundle (AAB)
```bash
# Build app bundle for Play Store
flutter build appbundle
```

### iOS Deployment
```bash
# Build for iOS (requires macOS)
flutter build ios
# Open Xcode project for signing
open ios/Runner.xcworkspace
```

## 📊 Performance Optimization

### Implemented Optimizations
1. **Image Optimization**: Appropriate asset sizes
2. **Code Splitting**: Lazy loading for screens
3. **State Management**: Efficient rebuilds with Provider
4. **Network Optimization**: Timeouts and retry logic
5. **Memory Management**: Proper disposal of controllers

### Monitoring
- **Performance Overlay**: `flutter run --profile`
- **Memory Usage**: DevTools memory tab
- **Frame Rate**: Performance overlay in app

## 🤝 Contributing

### Development Workflow
1. **Branch Strategy**: Feature branches from `main`
2. **Code Standards**: Follow Dart style guide
3. **Testing**: Write tests for new features
4. **Documentation**: Update README with changes
5. **Review**: Submit PRs for code review

### Code Standards
- **Dart Format**: `dart format .`
- **Linting**: `flutter analyze`
- **Imports**: Organized imports with blank lines
- **Naming**: camelCase for variables, PascalCase for classes

## 📞 Support

### Getting Help
1. **Documentation**: Check this README and code comments
2. **Flutter Docs**: Official Flutter documentation
3. **Debugging**: Use Flutter DevTools
4. **Issues**: Check existing issues or create new one

### Known Limitations
1. **iOS NFC**: Requires physical device for testing
2. **Offline Storage**: Limited by device storage
3. **Background NFC**: App must be in foreground
4. **Network Dependency**: Requires internet for initial login

## 📄 License
Proprietary software. All rights reserved.

---

*Last Updated: April 2026*  
*Version: 1.0.0+1*  
*Phase 9: Structural & Operational Lockdown - COMPLETE*