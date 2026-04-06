import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/hrms_models.dart';

class LeaveRequestScreen extends StatefulWidget {
  const LeaveRequestScreen({super.key});

  @override
  State<LeaveRequestScreen> createState() => _LeaveRequestScreenState();
}

class _LeaveRequestScreenState extends State<LeaveRequestScreen> {
  List<LeaveRequest> _requests = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchLeaves();
  }

  Future<void> _fetchLeaves() async {
    try {
      final api = context.read<ApiService>();
      final response = await api.dio.get('/leaves/my-requests');
      final List<dynamic> items = response.data['items'];
      
      if (mounted) {
        setState(() {
          _requests = items.map((json) => LeaveRequest.fromJson(json)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load leave history';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _submitRequest() async {
    // Basic form implementation via a dialog
    String leaveType = 'Annual';
    DateTime startDate = DateTime.now();
    DateTime endDate = DateTime.now().add(const Duration(days: 1));
    final reasonController = TextEditingController();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20, right: 20, top: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('New Leave Request', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              DropdownButtonFormField<String>(
                value: leaveType,
                items: ['Annual', 'Sick', 'Unpaid', 'Maternity', 'Paternity']
                    .map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                onChanged: (val) => setModalState(() => leaveType = val!),
                decoration: const InputDecoration(labelText: 'Leave Type', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 15),
              ListTile(
                title: const Text('Start Date'),
                subtitle: Text(DateFormat('yyyy-MM-dd').format(startDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(context: context, initialDate: startDate, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                  if (picked != null) setModalState(() => startDate = picked);
                },
              ),
              ListTile(
                title: const Text('End Date'),
                subtitle: Text(DateFormat('yyyy-MM-dd').format(endDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(context: context, initialDate: endDate, firstDate: startDate, lastDate: DateTime.now().add(const Duration(days: 365)));
                  if (picked != null) setModalState(() => endDate = picked);
                },
              ),
              const SizedBox(height: 15),
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(labelText: 'Reason (Optional)', border: OutlineInputBorder()),
                maxLines: 3,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  final duration = endDate.difference(startDate).inDays + 1;
                  final request = LeaveRequest(
                    leaveType: leaveType,
                    startDate: DateFormat('yyyy-MM-dd').format(startDate),
                    endDate: DateFormat('yyyy-MM-dd').format(endDate),
                    duration: duration,
                    reason: reasonController.text,
                  );
                  
                  try {
                    final api = context.read<ApiService>();
                    await api.dio.post('/leaves/request', data: request.toJson());
                    if (mounted) {
                      Navigator.pop(context);
                      _fetchLeaves();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Leave request submitted successfully')));
                    }
                  } catch (e) {
                    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit request')));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white, padding: const EdgeInsets.all(15)),
                child: const Text('SUBMIT REQUEST'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: _submitRequest,
        backgroundColor: Colors.blue,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_requests.isEmpty) return const Center(child: Text('No leave requests found.'));

    return RefreshIndicator(
      onRefresh: _fetchLeaves,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _requests.length,
        itemBuilder: (context, index) {
          final request = _requests[index];
          return Card(
            child: ListTile(
              title: Text('${request.leaveType} Leave'),
              subtitle: Text('${request.startDate} to ${request.endDate} (${request.duration} days)'),
              trailing: _getStatusChip(request.status ?? 'Pending'),
            ),
          );
        },
      ),
    );
  }

  Widget _getStatusChip(String status) {
    Color color;
    switch (status) {
      case 'Approved': color = Colors.green; break;
      case 'Rejected': color = Colors.red; break;
      default: color = Colors.orange;
    }
    return Chip(
      label: Text(status, style: const TextStyle(color: Colors.white, fontSize: 10)),
      backgroundColor: color,
    );
  }
}
