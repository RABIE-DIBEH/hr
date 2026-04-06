class AttendanceRecord {
  final int recordId;
  final String checkIn;
  final String? checkOut;
  final double? workHours;
  final String status;
  final bool isVerifiedByManager;

  AttendanceRecord({
    required this.recordId,
    required this.checkIn,
    this.checkOut,
    this.workHours,
    required this.status,
    required this.isVerifiedByManager,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      recordId: json['recordId'],
      checkIn: json['checkIn'],
      checkOut: json['checkOut'],
      workHours: json['workHours']?.toDouble(),
      status: json['status'],
      isVerifiedByManager: json['isVerifiedByManager'] ?? false,
    );
  }
}

class LeaveRequest {
  final int? requestId;
  final String leaveType;
  final String startDate;
  final String endDate;
  final int duration;
  final String? reason;
  final String? status;

  LeaveRequest({
    this.requestId,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.duration,
    this.reason,
    this.status,
  });

  Map<String, dynamic> toJson() => {
    'leaveType': leaveType,
    'startDate': startDate,
    'endDate': endDate,
    'duration': duration,
    'reason': reason,
  };

  factory LeaveRequest.fromJson(Map<String, dynamic> json) {
    return LeaveRequest(
      requestId: json['requestId'],
      leaveType: json['leaveType'],
      startDate: json['startDate'],
      endDate: json['endDate'],
      duration: json['duration'],
      reason: json['reason'],
      status: json['status'],
    );
  }
}
