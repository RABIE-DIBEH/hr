import 'package:flutter/material.dart';

void main() {
  runApp(const HRMSApp());
}

class HRMSApp extends StatelessWidget {
  const HRMSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HRMS Pro Mobile',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.shield_rounded, size: 80, color: Colors.blue),
            const SizedBox(height: 20),
            const Text('HRMS PRO', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const Text('Attendance & HR Portal', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 40),
            ElevatedButton.icon(
              onPressed: () {
                // TODO: Implement NFC Scanning Logic
              },
              icon: const Icon(Icons.nfc),
              label: const Text('Login with NFC Card'),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(20)),
            ),
          ],
        ),
      ),
    );
  }
}
