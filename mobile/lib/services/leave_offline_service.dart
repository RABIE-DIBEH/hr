import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class LeaveOfflineService {
  final ApiService _apiService;
  static const String _offlineLeavesKey = 'offline_leave_requests';

  LeaveOfflineService(this._apiService);

  /// Save a leave request offline when network is unavailable
  Future<void> _saveOfflineLeave(Map<String, dynamic> leaveData) async {
    final prefs = await SharedPreferences.getInstance();
    final leaves = prefs.getStringList(_offlineLeavesKey) ?? [];
    leaveData['queuedAt'] = DateTime.now().toIso8601String();
    leaves.add(jsonEncode(leaveData));
    await prefs.setStringList(_offlineLeavesKey, leaves);
  }

  /// Submit a leave request, queuing it offline if network fails
  Future<Map<String, dynamic>> submitLeaveRequest({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    required double duration,
    required String reason,
  }) async {
    final leaveData = {
      'leaveType': leaveType,
      'startDate': startDate.toIso8601String().split('T')[0],
      'endDate': endDate.toIso8601String().split('T')[0],
      'duration': duration,
      'reason': reason,
    };

    try {
      await _apiService.dio.post(
        '/leaves/request',
        data: leaveData,
      ).timeout(const Duration(seconds: 10));

      return {
        'ok': true,
        'message': 'Leave request submitted successfully',
        'offline': false,
      };
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        await _saveOfflineLeave(leaveData);
        return {
          'ok': true,
          'message': 'Saved offline. Will sync when back online.',
          'offline': true,
        };
      }

      String msg = 'Request failed';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      }
      return {'ok': false, 'message': msg, 'offline': false};
    } catch (e) {
      await _saveOfflineLeave(leaveData);
      return {
        'ok': true,
        'message': 'Saved offline due to error.',
        'offline': true,
      };
    }
  }

  /// Sync all pending offline leave requests
  Future<int> syncOfflineLeaves() async {
    final prefs = await SharedPreferences.getInstance();
    final leaves = prefs.getStringList(_offlineLeavesKey) ?? [];
    if (leaves.isEmpty) return 0;

    int successCount = 0;
    final List<String> remainingLeaves = [];

    for (final leaveJson in leaves) {
      try {
        final leave = jsonDecode(leaveJson);
        await _apiService.dio.post(
          '/leaves/request',
          data: leave,
        ).timeout(const Duration(seconds: 10));

        successCount++;
      } catch (e) {
        remainingLeaves.add(leaveJson);
      }
    }

    await prefs.setStringList(_offlineLeavesKey, remainingLeaves);
    return successCount;
  }

  /// Get count of pending offline leave requests
  Future<int> getOfflineCount() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_offlineLeavesKey) ?? []).length;
  }

  /// Get all pending offline leave requests
  Future<List<Map<String, dynamic>>> getOfflineLeaves() async {
    final prefs = await SharedPreferences.getInstance();
    final leaves = prefs.getStringList(_offlineLeavesKey) ?? [];
    return leaves
        .map((l) => jsonDecode(l) as Map<String, dynamic>)
        .toList();
  }
}
