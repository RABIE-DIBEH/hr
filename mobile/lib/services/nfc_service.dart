import 'package:nfc_manager/nfc_manager.dart';
import 'api_service.dart';

class NfcService {
  final ApiService _apiService;

  NfcService(this._apiService);

  Future<bool> isNfcAvailable() async {
    return await NfcManager.instance.isAvailable();
  }

  Future<String?> scanNfcTag() async {
    String? uid;
    
    try {
      await NfcManager.instance.startSession(onDiscovered: (NfcTag tag) async {
        final ndef = Ndef.from(tag);
        // UID extraction depends on tag type, but common way for many tags is via 'identifier'
        final List<int> identifier = tag.data['isDep'] != null 
          ? tag.data['isDep']['identifier'] 
          : tag.data['nfca'] != null 
            ? tag.data['nfca']['identifier'] 
            : tag.data['mifare'] != null 
              ? tag.data['mifare']['identifier'] 
              : [];
        
        if (identifier.isNotEmpty) {
          uid = identifier.map((e) => e.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
        }
        
        await NfcManager.instance.stopSession();
      });
      
      // We need to wait for the session to find a tag or timeout
      // In a real app, this would be more robust with a Completer
      int attempts = 0;
      while (uid == null && attempts < 100) {
        await Future.delayed(const Duration(milliseconds: 100));
        attempts++;
      }
      
      return uid;
    } catch (e) {
      await NfcManager.instance.stopSession();
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
