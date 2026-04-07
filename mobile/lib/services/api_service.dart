import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/env_config.dart';

class ApiService {
  final Dio _dio = Dio();
  final _storage = const FlutterSecureStorage();

  static const String authTokenKey = 'hrms_jwt';

  ApiService() {
    _dio.options.baseUrl = EnvConfig.apiBaseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 5);
    _dio.options.receiveTimeout = const Duration(seconds: 10);

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: authTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        // Auto-unwrap ApiResponse data field if present
        if (response.data is Map &&
            response.data.containsKey('data') &&
            response.data.containsKey('status')) {
          response.data = response.data['data'];
        }
        return handler.next(response);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          await _storage.delete(key: authTokenKey);
          // Navigate to login by triggering a full app rebuild via the
          // AuthProvider's logout flow. We dispatch a custom event that
          // the AuthProvider listens to.
          _dio.options.extra['onUnauthorized']?.call();
        }
        return handler.next(e);
      },
    ));
  }

  /// Called by the AuthProvider to register the logout trigger.
  void setUnauthorizedHandler(VoidCallback onUnauthorized) {
    _dio.options.extra['onUnauthorized'] = onUnauthorized;
  }

  Dio get dio => _dio;
  FlutterSecureStorage get storage => _storage;
}
