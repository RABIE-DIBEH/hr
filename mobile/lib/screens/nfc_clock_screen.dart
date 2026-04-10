import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vibration/vibration.dart';
import '../services/nfc_service.dart';
import '../services/api_service.dart';
import '../widgets/connectivity_indicator.dart';

class NfcClockScreen extends StatefulWidget {
  const NfcClockScreen({super.key});

  @override
  State<NfcClockScreen> createState() => _NfcClockScreenState();
}

class _NfcClockScreenState extends State<NfcClockScreen> {
  bool _isScanning = false;
  bool _isProcessing = false;
  bool _isSyncing = false;
  String? _statusMessage;
  bool? _isSuccess;
  int _offlineCount = 0;
  DateTime? _lastScanTime;

  @override
  void initState() {
    super.initState();
    _checkOffline();
    _startNfcScan();
  }

  Future<void> _checkOffline() async {
    final count = await context.read<NfcService>().getOfflineCount();
    if (mounted) setState(() => _offlineCount = count);
  }

  Future<void> _syncScans() async {
    if (_isSyncing) return;
    setState(() => _isSyncing = true);
    try {
      final synced = await context.read<NfcService>().syncOfflineScans();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Successfully synced $synced scans.'))
        );
        _checkOffline();
      }
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  Future<void> _startNfcScan() async {
    if (_lastScanTime != null) {
      final diff = DateTime.now().difference(_lastScanTime!);
      if (diff.inMinutes < 5) {
        final proceed = await _showDuplicateConfirm();
        if (proceed != true) return;
      }
    }

    setState(() {
      _isScanning = true;
      _isProcessing = false;
      _isSuccess = null;
      _statusMessage = 'Ready to scan. Please hold your card near the device.';
    });

    final nfcService = context.read<NfcService>();
    final isAvailable = await nfcService.isNfcAvailable();

    if (!isAvailable) {
      _showResult(false, 'NFC is not supported on this device.');
      return;
    }

    final uid = await nfcService.scanNfcTag();
    if (uid == null) {
      if (mounted) _showResult(false, 'Failed to read NFC tag. Please try again.');
      return;
    }

    if (mounted) {
      setState(() {
        _isScanning = false;
        _isProcessing = true;
        _statusMessage = 'Tag detected! Processing...';
      });

      try {
        final result = await nfcService.clockByNfc(uid);
        final ok = result['ok'] == true;
        final msg = result['message']?.toString() ??
            (ok ? 'Attendance recorded successfully!' : 'An error occurred.');
        
        _lastScanTime = DateTime.now();
        await _checkOffline();
        _showResult(ok, msg);
      } catch (e) {
        _showResult(false, 'Connection error. Please check your network.');
      }
    }
  }

  void _showResult(bool success, String message) async {
    if (!mounted) return;

    setState(() {
      _isScanning = false;
      _isProcessing = false;
      _isSuccess = success;
      _statusMessage = message;
    });

    if (await Vibration.hasVibrator() ?? false) {
      if (success) {
        Vibration.vibrate(duration: 100);
      } else {
        Vibration.vibrate(pattern: [0, 200, 100, 200]);
      }
    }

    if (success) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) Navigator.pop(context);
      });
    }
  }

  Future<bool?> _showDuplicateConfirm() async {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Duplicate Scan?'),
        content: const Text('You just scanned recently. Was this a mistake or do you want to Clock-Out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('MISTAKE')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('PROCEED')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess != null) {
      return Scaffold(
        backgroundColor: _isSuccess! ? Colors.green.shade900 : Colors.red.shade900,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _isSuccess! ? Icons.check_circle_outline : Icons.error_outline,
                size: 150,
                color: Colors.white,
              ),
              const SizedBox(height: 40),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  _statusMessage ?? '',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
              const SizedBox(height: 60),
              if (!_isSuccess!)
                ElevatedButton(
                  onPressed: _startNfcScan,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.red.shade900,
                    padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  ),
                  child: const Text('TRY AGAIN', style: TextStyle(fontWeight: FontWeight.bold)),
                )
              else
                const Text('Redirecting...', style: TextStyle(color: Colors.white70)),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('NFC Clocking'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: ConnectivityIndicator(
              connectivityStream: context.read<ApiService>().connectivityStream,
            ),
          ),
          if (_offlineCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 12.0),
              child: TextButton.icon(
                onPressed: _isSyncing ? null : _syncScans,
                icon: _isSyncing
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.sync, color: Colors.orangeAccent),
                label: Text('$_offlineCount pending', style: const TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.bold)),
              ),
            )
        ],
      ),
      extendBodyBehindAppBar: true,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.blue.shade900, Colors.black],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildScannerIcon(),
              const SizedBox(height: 50),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 50),
                child: Text(
                  _statusMessage ?? 'Initialize...',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.w300),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildScannerIcon() {
    return Stack(
      alignment: Alignment.center,
      children: [
        if (_isScanning || _isProcessing)
          const SizedBox(
            width: 200,
            height: 200,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.blueAccent),
          ),
        Container(
          width: 160,
          height: 160,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white10),
          ),
          child: Icon(
            _isProcessing ? Icons.sync : Icons.nfc,
            size: 80,
            color: Colors.white,
          ),
        ),
      ],
    );
  }
}
