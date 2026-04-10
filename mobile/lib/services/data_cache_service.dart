import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

/// Provides basic caching for attendance and leave data to prevent app crashes
/// during intermittent Wi-Fi drops and improve perceived performance.
class DataCacheService {
  final ApiService _apiService;
  static const String _attendanceCacheKey = 'cached_attendance';
  static const String _leaveCacheKey = 'cached_leaves';
  static const String _cacheTimestampSuffix = '_timestamp';

  // Cache validity duration (5 minutes)
  static const Duration _cacheValidityDuration = Duration(minutes: 5);

  DataCacheService(this._apiService);

  // ─── Attendance Cache ───────────────────────────────────────────

  /// Fetch attendance data, using cache if network is unavailable
  Future<Map<String, dynamic>> getAttendanceData({
    required int page,
    required int size,
  }) async {
    // Try network first
    try {
      final response = await _apiService.dio.get(
        '/attendance/my?page=$page&size=$size',
      ).timeout(const Duration(seconds: 10));

      // Update cache with fresh data
      await _cacheAttendance(response.data);
      return {'ok': true, 'data': response.data, 'fromCache': false};
    } on DioException catch (e) {
      if (_isNetworkError(e)) {
        // Fallback to cache
        final cached = await _getCachedAttendance();
        if (cached != null) {
          return {'ok': true, 'data': cached, 'fromCache': true};
        }
      }
      return {'ok': false, 'message': _getErrorMessage(e), 'fromCache': false};
    } catch (e) {
      final cached = await _getCachedAttendance();
      if (cached != null) {
        return {'ok': true, 'data': cached, 'fromCache': true};
      }
      return {'ok': false, 'message': 'Failed to load attendance', 'fromCache': false};
    }
  }

  Future<void> _cacheAttendance(dynamic data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_attendanceCacheKey, jsonEncode(data));
    await prefs.setInt(
      '$_attendanceCacheKey$_cacheTimestampSuffix',
      DateTime.now().millisecondsSinceEpoch,
    );
  }

  Future<dynamic> _getCachedAttendance() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(_attendanceCacheKey);
    if (cached == null) return null;

    // Check if cache is still valid
    final timestamp = prefs.getInt('$_attendanceCacheKey$_cacheTimestampSuffix') ?? 0;
    final cacheAge = DateTime.now().millisecondsSinceEpoch - timestamp;
    if (cacheAge > _cacheValidityDuration.inMilliseconds) {
      return null; // Cache expired
    }

    return jsonDecode(cached);
  }

  // ─── Leave Requests Cache ───────────────────────────────────────

  /// Fetch leave requests, using cache if network is unavailable
  Future<Map<String, dynamic>> getLeaveRequests({
    required int page,
    required int size,
  }) async {
    try {
      final response = await _apiService.dio.get(
        '/leaves/my-requests?page=$page&size=$size',
      ).timeout(const Duration(seconds: 10));

      await _cacheLeaveRequests(response.data);
      return {'ok': true, 'data': response.data, 'fromCache': false};
    } on DioException catch (e) {
      if (_isNetworkError(e)) {
        final cached = await _getCachedLeaveRequests();
        if (cached != null) {
          return {'ok': true, 'data': cached, 'fromCache': true};
        }
      }
      return {'ok': false, 'message': _getErrorMessage(e), 'fromCache': false};
    } catch (e) {
      final cached = await _getCachedLeaveRequests();
      if (cached != null) {
        return {'ok': true, 'data': cached, 'fromCache': true};
      }
      return {'ok': false, 'message': 'Failed to load leave requests', 'fromCache': false};
    }
  }

  Future<void> _cacheLeaveRequests(dynamic data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_leaveCacheKey, jsonEncode(data));
    await prefs.setInt(
      '$_leaveCacheKey$_cacheTimestampSuffix',
      DateTime.now().millisecondsSinceEpoch,
    );
  }

  Future<dynamic> _getCachedLeaveRequests() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(_leaveCacheKey);
    if (cached == null) return null;

    final timestamp = prefs.getInt('$_leaveCacheKey$_cacheTimestampSuffix') ?? 0;
    final cacheAge = DateTime.now().millisecondsSinceEpoch - timestamp;
    if (cacheAge > _cacheValidityDuration.inMilliseconds) {
      return null;
    }

    return jsonDecode(cached);
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  bool _isNetworkError(DioException e) {
    return e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError;
  }

  String _getErrorMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }
    return 'Network error occurred';
  }

  /// Clear all cached data
  Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_attendanceCacheKey);
    await prefs.remove('$_attendanceCacheKey$_cacheTimestampSuffix');
    await prefs.remove(_leaveCacheKey);
    await prefs.remove('$_leaveCacheKey$_cacheTimestampSuffix');
  }
}
