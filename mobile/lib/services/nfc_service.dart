import 'dart:async';
import 'package:nfc_manager/nfc_manager.dart';
import 'api_service.dart';

class NfcService {
  final ApiService _apiService;

  NfcService(this._apiService);

  Future<bool> isNfcAvailable() async {
    return await NfcManager.instance.isAvailable();
  }

  /// Scans an NFC tag and returns its UID using a Completer for proper async handling.
  /// Returns null if no tag is found within the timeout (10 seconds).
  Future<String?> scanNfcTag() async {
    final completer = Completer<String?>();
    bool sessionStopped = false;

    try {
      await NfcManager.instance.startSession(onDiscovered: (NfcTag tag) async {
        if (sessionStopped) return;
        sessionStopped = true;

        try {
          // UID extraction depends on tag type
          final List<int> identifier = tag.data['isDep'] != null
              ? tag.data['isDep']['identifier']
              : tag.data['nfca'] != null
                  ? tag.data['nfca']['identifier']
                  : tag.data['mifare'] != null
                      ? tag.data['mifare']['identifier']
                      : [];

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
          if (!completer.isCompleted) {
            completer.complete(null);
          }
        }
      });

      // Timeout after 10 seconds
      final timeout = Future<String?>.delayed(
        const Duration(seconds: 10),
        () => null,
      );

      final result = await Future.any<String?>([completer.future, timeout]);
      if (result == null) {
        if (!sessionStopped) {
          sessionStopped = true;
          await NfcManager.instance.stopSession();
        }
        return null;
      }
      return result;
    } catch (e) {
      if (!sessionStopped) {
        sessionStopped = true;
        try {
          await NfcManager.instance.stopSession();
        } catch (_) {}
      }
      return null;
    }
  }

  Future<Map<String, dynamic>> clockByNfc(String cardUid) async {
    try {
      final response = await _apiService.dio.post(
        '/attendance/nfc-clock',
        data: {'cardUid': cardUid},
      );
      return response.data;
    } catch (e) {
      return {'status': 'Error', 'message': e.toString()};
    }
  }
}
