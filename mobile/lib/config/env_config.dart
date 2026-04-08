/// Environment configuration for the HRMS mobile app.
///
/// To change the API URL, edit [apiBaseUrl] or set the
/// `API_BASE_URL` constant below.
class EnvConfig {
  /// Base URL for the HRMS backend API.
  /// - Android emulator: 10.0.2.2
  /// - Linux desktop: 127.0.0.1 or localhost
  /// Change this to your production/staging URL before building.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:8080/api',
  );

  /// Whether the app is running in development mode.
  static const bool isDevelopment = bool.fromEnvironment(
    'DEBUG_MODE',
    defaultValue: true,
  );
}
