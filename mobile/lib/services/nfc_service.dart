import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class NfcService {
  final ApiService _apiService;
  static const String _offlineScansKey = 'offline_nfc_scans';

  NfcService(this._apiService);

  Future<bool> isNfcAvailable() async {
    try {
      return await NfcManager.instance.isAvailable();
    } catch (e) {
      return false;
    }
  }

  Future<String?> scanNfcTag() async {
    final completer = Completer<String?>();
    bool sessionStopped = false;

    try {
      await NfcManager.instance.startSession(onDiscovered: (NfcTag tag) async {
        if (sessionStopped) return;
        sessionStopped = true;

        try {
          final identifier = _getIdentifier(tag);
          String? uid;
          if (identifier.isNotEmpty) {
            uid = identifier
                .map((e) => e.toRadixString(16).padLeft(2, '0'))
                .join(':')
                .toUpperCase();
          }

          await NfcManager.instance.stopSession();
          completer.complete(uid);
        } catch (e) {
          if (!completer.isCompleted) completer.complete(null);
        }
      });

      final timeout = Future<String?>.delayed(const Duration(seconds: 10), () => null);
      final result = await Future.any<String?>([completer.future, timeout]);
      
      if (result == null && !sessionStopped) {
        sessionStopped = true;
        await NfcManager.instance.stopSession();
      }
      return result;
    } catch (e) {
      if (!sessionStopped) {
        sessionStopped = true;
        try { await NfcManager.instance.stopSession(); } catch (_) {}
      }
      return null;
    }
  }

  List<int> _getIdentifier(NfcTag tag) {
    if (tag.data['isDep'] != null) return List<int>.from(tag.data['isDep']['identifier']);
    if (tag.data['nfca'] != null) return List<int>.from(tag.data['nfca']['identifier']);
    if (tag.data['mifare'] != null) return List<int>.from(tag.data['mifare']['identifier']);
    return [];
  }

  Future<Map<String, dynamic>> clockByNfc(String cardUid) async {
    try {
      final response = await _apiService.dio.post(
        '/attendance/nfc-clock',
        data: {'cardUid': cardUid},
      ).timeout(const Duration(seconds: 5));

      final data = response.data;
      return {
        'ok': true,
        'message': (data is Map && data['status'] != null) ? data['status'].toString() : 'Attendance recorded.',
        'offline': false,
      };
    } on DioException catch (e) {
      // Check for network connectivity issues
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        await _saveOfflineScan(cardUid);
        return {
          'ok': true,
          'message': 'Saved offline. Will sync when back online.',
          'offline': true,
        };
      }
      
      String msg = 'Request failed';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) msg = data['message'].toString();
      return {'ok': false, 'message': msg, 'offline': false};
    } catch (e) {
      await _saveOfflineScan(cardUid);
      return {
        'ok': true,
        'message': 'Saved offline due to error.',
        'offline': true,
      };
    }
  }

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
    final prefs = await SharedPreferences.getInstance();
    final scans = prefs.getStringList(_offlineScansKey) ?? [];
    if (scans.isEmpty) return 0;

    int successCount = 0;
    final List<String> remainingScans = [];

    for (final scanJson in scans) {
      try {
        final scan = jsonDecode(scanJson);
        final response = await _apiService.dio.post(
          '/attendance/nfc-clock',
          data: {'cardUid': scan['cardUid']},
        ).timeout(const Duration(seconds: 5));
        
        if (response.statusCode == 200) {
          successCount++;
        } else {
          remainingScans.add(scanJson);
        }
      } catch (e) {
        remainingScans.add(scanJson);
      }
    }

    await prefs.setStringList(_offlineScansKey, remainingScans);
    return successCount;
  }

  Future<int> getOfflineCount() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_offlineScansKey) ?? []).length;
  }
}
