import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  final Dio _dio = Dio();
  final _storage = const FlutterSecureStorage();
  
  static const String baseUrl = 'http://localhost:8080/api'; // Adjust for emulator/device
  static const String authTokenKey = 'hrms_jwt';

  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 5);
    _dio.options.receiveTimeout = const Duration(seconds: 3);
    
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
        if (response.data is Map && response.data.containsKey('data') && response.data.containsKey('status')) {
          response.data = response.data['data'];
        }
        return handler.next(response);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          await _storage.delete(key: authTokenKey);
          // TODO: Trigger navigation to login screen via a provider or stream
        }
        return handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;
}
