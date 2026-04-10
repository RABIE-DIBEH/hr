import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../config/env_config.dart';

class ApiService {
  final Dio _dio = Dio();
  final _storage = const FlutterSecureStorage();
  final _connectivity = Connectivity();

  static const String authTokenKey = 'hrms_jwt';
  static const int _maxRetries = 3;
  static const Duration _baseRetryDelay = Duration(seconds: 2);

  ApiService() {
    _dio.options.baseUrl = EnvConfig.apiBaseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 5);
    _dio.options.receiveTimeout = const Duration(seconds: 10);

    // Token injection + response unwrapping interceptor
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
          _dio.options.extra['onUnauthorized']?.call();
        }
        return handler.next(e);
      },
    ));

    // Retry interceptor with exponential backoff (runs after the first interceptor)
    _dio.interceptors.add(QueuedInterceptorsWrapper(
      onError: (DioException err, handler) async {
        // Only retry on network-related errors
        final shouldRetry = err.type == DioExceptionType.connectionTimeout ||
            err.type == DioExceptionType.sendTimeout ||
            err.type == DioExceptionType.receiveTimeout ||
            err.type == DioExceptionType.connectionError;

        if (!shouldRetry) {
          return handler.next(err);
        }

        // Skip if this is already a retry
        if (err.requestOptions.extra['retryCount'] != null) {
          return handler.next(err);
        }

        int retryCount = 0;
        DioException lastError = err;

        while (retryCount < _maxRetries) {
          retryCount++;
          final delay = _baseRetryDelay * (1 << (retryCount - 1)); // Exponential backoff: 2s, 4s, 8s
          await Future.delayed(delay);

          // Check connectivity before retry — no point retrying without connectivity
          final connectivityResult = await _connectivity.checkConnectivity();
          if (connectivityResult == ConnectivityResult.none) {
            break;
          }

          try {
            final requestOptions = err.requestOptions;
            requestOptions.extra['retryCount'] = retryCount;
            final response = await _dio.fetch(requestOptions);
            return handler.resolve(response);
          } on DioException catch (e) {
            lastError = e;
          }
        }

        handler.next(lastError);
      },
    ));
  }

  /// Called by the AuthProvider to register the logout trigger.
  void setUnauthorizedHandler(VoidCallback onUnauthorized) {
    _dio.options.extra['onUnauthorized'] = onUnauthorized;
  }

  /// Check if device currently has network connectivity
  Future<bool> isConnected() async {
    final connectivityResult = await _connectivity.checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  /// Stream of connectivity changes
  Stream<ConnectivityResult> get connectivityStream => _connectivity.onConnectivityChanged;

  Dio get dio => _dio;
  FlutterSecureStorage get storage => _storage;
}
