import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService;
  final ApiService _apiService;
  bool _isAuthenticated = false;
  bool _isLoading = true;
  Map<String, dynamic>? _userClaims;

  AuthProvider(this._authService, this._apiService) {
    // Register 401 handler: when any API call returns 401, auto-logout
    _apiService.setUnauthorizedHandler(() {
      _isAuthenticated = false;
      _userClaims = null;
      notifyListeners();
    });
    _checkAuth();
  }

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get userClaims => _userClaims;

  Future<void> _checkAuth() async {
    _isAuthenticated = await _authService.isLoggedIn();
    if (_isAuthenticated) {
      _userClaims = await _authService.getDecodedToken();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    final success = await _authService.login(email, password);
    if (success) {
      _isAuthenticated = true;
      _userClaims = await _authService.getDecodedToken();
    }

    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<void> logout() async {
    await _authService.logout();
    _isAuthenticated = false;
    _userClaims = null;
    notifyListeners();
  }
}
