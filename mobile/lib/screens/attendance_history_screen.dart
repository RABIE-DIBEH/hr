import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/hrms_models.dart';

class AttendanceHistoryScreen extends StatefulWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  State<AttendanceHistoryScreen> createState() => _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends State<AttendanceHistoryScreen> {
  List<AttendanceRecord> _records = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchAttendance();
  }

  Future<void> _fetchAttendance() async {
    try {
      final api = context.read<ApiService>();
      final response = await api.dio.get('/attendance/my');
      
      // Since ApiService unwraps ApiResponse.data, response.data should be the PaginatedResponse map
      final List<dynamic> items = response.data['items'];
      
      if (mounted) {
        setState(() {
          _records = items.map((json) => AttendanceRecord.fromJson(json)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load attendance history';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_records.isEmpty) return const Center(child: Text('No attendance records found.'));

    return RefreshIndicator(
      onRefresh: _fetchAttendance,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _records.length,
        itemBuilder: (context, index) {
          final record = _records[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: _getStatusIcon(record.status),
              title: Text(DateFormat('EEEE, MMM d, yyyy').format(DateTime.parse(record.checkIn))),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('In: ${DateFormat('hh:mm a').format(DateTime.parse(record.checkIn))}'),
                  if (record.checkOut != null)
                    Text('Out: ${DateFormat('hh:mm a').format(DateTime.parse(record.checkOut!))}'),
                  if (record.workHours != null)
                    Text('Duration: ${record.workHours!.toStringAsFixed(1)} hours'),
                ],
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(record.status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      record.status,
                      style: TextStyle(color: _getStatusColor(record.status), fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (record.isVerifiedByManager)
                    const Icon(Icons.verified, size: 16, color: Colors.blue),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _getStatusIcon(String status) {
    IconData icon;
    Color color;
    switch (status) {
      case 'Present':
        icon = Icons.check_circle_outline;
        color = Colors.green;
        break;
      case 'Late':
        icon = Icons.access_time;
        color = Colors.orange;
        break;
      case 'Absent':
        icon = Icons.cancel_outlined;
        color = Colors.red;
        break;
      default:
        icon = Icons.help_outline;
        color = Colors.grey;
    }
    return CircleAvatar(backgroundColor: color.withOpacity(0.1), child: Icon(icon, color: color));
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Present': return Colors.green;
      case 'Late': return Colors.orange;
      case 'Absent': return Colors.red;
      default: return Colors.grey;
    }
  }
}
