import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService;
  final _storage = const FlutterSecureStorage();
  static const String authTokenKey = 'hrms_jwt';

  AuthService(this._apiService);

  /// Login returns a structured result: {ok, token?, error?, offline?}
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      ).timeout(const Duration(seconds: 10));

      final token = response.data['token'];
      if (token != null) {
        await _storage.write(key: authTokenKey, value: token);
        return {'ok': true, 'token': token};
      }
      return {'ok': false, 'error': 'No token received from server'};
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        return {'ok': false, 'error': 'Network error. Please check your connection.', 'offline': true};
      }

      String msg = 'Login failed';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      }
      return {'ok': false, 'error': msg};
    } catch (e) {
      return {'ok': false, 'error': 'Unexpected error: ${e.toString()}'};
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: authTokenKey);
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: authTokenKey);
    if (token != null && !JwtDecoder.isExpired(token)) {
      return true;
    }
    return false;
  }

  Future<Map<String, dynamic>?> getDecodedToken() async {
    final token = await _storage.read(key: authTokenKey);
    if (token != null) {
      return JwtDecoder.decode(token);
    }
    return null;
  }
}
