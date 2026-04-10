import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/nfc_service.dart';

class NfcClockScreen extends StatefulWidget {
  const NfcClockScreen({super.key});

  @override
  State<NfcClockScreen> createState() => _NfcClockScreenState();
}

class _NfcClockScreenState extends State<NfcClockScreen> {
  bool _isScanning = false;
  String? _statusMessage;
  bool _isError = false;

  @override
  void initState() {
    super.initState();
    _startNfcScan();
  }

  Future<void> _startNfcScan() async {
    setState(() {
      _isScanning = true;
      _statusMessage = 'Ready to scan. Please hold your card near the device.';
      _isError = false;
    });

    final nfcService = context.read<NfcService>();
    final isAvailable = await nfcService.isNfcAvailable();

    if (!isAvailable) {
      setState(() {
        _isScanning = false;
        _statusMessage = 'NFC is not supported on this device.';
        _isError = true;
      });
      return;
    }

    final uid = await nfcService.scanNfcTag();
    if (uid == null) {
      if (mounted) {
        setState(() {
          _isScanning = false;
          _statusMessage = 'Failed to read NFC tag. Please try again.';
          _isError = true;
        });
      }
      return;
    }

    if (mounted) {
      setState(() {
        _statusMessage = 'Tag detected! Processing...';
      });

      final result = await nfcService.clockByNfc(uid);

      if (mounted) {
        final ok = result['ok'] == true;
        final msg = result['message']?.toString() ??
            (ok ? 'Attendance recorded successfully!' : 'An error occurred.');
        setState(() {
          _isScanning = false;
          _statusMessage = msg;
          _isError = !ok;
        });

        if (ok) {
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) Navigator.pop(context);
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('NFC Clocking')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildNfcIcon(),
              const SizedBox(height: 40),
              Text(
                _statusMessage ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: _isError ? Colors.red : Colors.black87,
                ),
              ),
              const SizedBox(height: 40),
              if (!_isScanning)
                ElevatedButton(
                  onPressed: _startNfcScan,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  ),
                  child: const Text('TRY AGAIN'),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNfcIcon() {
    return Stack(
      alignment: Alignment.center,
      children: [
        if (_isScanning)
          const SizedBox(
            width: 150,
            height: 150,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.blue),
          ),
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: _isError ? Colors.red.withOpacity(0.1) : Colors.blue.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            _isError ? Icons.error_outline : Icons.nfc,
            size: 60,
            color: _isError ? Colors.red : Colors.blue,
          ),
        ),
      ],
    );
  }
}
