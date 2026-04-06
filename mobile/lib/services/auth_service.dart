import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService;
  final _storage = const FlutterSecureStorage();
  static const String authTokenKey = 'hrms_jwt';

  AuthService(this._apiService);

  Future<bool> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      
      // Since ApiService unwraps, the response.data here should be the map containing the token
      final token = response.data['token'];
      if (token != null) {
        await _storage.write(key: authTokenKey, value: token);
        return true;
      }
      return false;
    } catch (e) {
      return false;
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
