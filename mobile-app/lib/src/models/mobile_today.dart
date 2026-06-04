class MobileToday {
  const MobileToday({
    required this.employeeName,
    required this.employeeNumber,
    required this.position,
    required this.businessDate,
    required this.assignment,
    required this.attendance,
    required this.activities,
    required this.leaveRequests,
  });

  final String employeeName;
  final String employeeNumber;
  final String position;
  final String businessDate;
  final AssignmentSummary? assignment;
  final AttendanceSummary? attendance;
  final List<ActivitySummary> activities;
  final List<LeaveSummary> leaveRequests;

  factory MobileToday.fromJson(Map<String, dynamic> json) {
    final employee = json['employee'] as Map<String, dynamic>? ?? {};
    final user = employee['user'] as Map<String, dynamic>? ?? {};
    final assignments =
        (json['activeAssignments'] as List<dynamic>? ??
                json['assignments'] as List<dynamic>? ??
                [])
            .whereType<Map<String, dynamic>>()
            .map(AssignmentSummary.fromJson)
            .toList();
    final leaves =
        (json['activeLeaveRequests'] as List<dynamic>? ??
                json['leaveRequests'] as List<dynamic>? ??
                [])
            .whereType<Map<String, dynamic>>()
            .map(LeaveSummary.fromJson)
            .toList();
    final activities =
        (json['dailyActivities'] as List<dynamic>? ??
                json['activities'] as List<dynamic>? ??
                [])
            .whereType<Map<String, dynamic>>()
            .map(ActivitySummary.fromJson)
            .toList();

    return MobileToday(
      employeeName:
          _firstText([
            user['fullName'],
            employee['fullName'],
            json['fullName'],
          ]) ??
          'Employee',
      employeeNumber: employee['employeeNumber']?.toString() ?? '-',
      position: _firstText([employee['position'], employee['jobTitle']]) ?? '-',
      businessDate: dateOnly(
        _firstText([json['businessDate'], json['date']]) ?? todayString(),
      ),
      assignment: assignments.isNotEmpty ? assignments.first : null,
      attendance: json['attendance'] is Map<String, dynamic>
          ? AttendanceSummary.fromJson(
              json['attendance'] as Map<String, dynamic>,
            )
          : null,
      activities: activities,
      leaveRequests: leaves,
    );
  }

  static MobileToday demo() {
    return const MobileToday(
      employeeName: 'Budi Santoso',
      employeeNumber: 'EMP-001',
      position: 'Security Officer',
      businessDate: '2026-06-03',
      assignment: AssignmentSummary(
        id: 'demo-assignment',
        clientName: 'PT Bank ABC',
        locationName: 'Cabang Medan',
        shiftName: 'Shift Pagi',
        shiftTime: '08:00 - 17:00',
        radiusMeter: 150,
      ),
      attendance: AttendanceSummary(
        status: 'READY',
        checkInTime: null,
        checkOutTime: null,
        lateMinutes: 0,
        workMinutes: 0,
      ),
      activities: [
        ActivitySummary(title: 'Patroli area lobby', status: 'DRAFT'),
        ActivitySummary(title: 'Pengecekan akses tamu', status: 'SUBMITTED'),
      ],
      leaveRequests: [LeaveSummary(type: 'SICK', status: 'APPROVED')],
    );
  }
}

class AssignmentSummary {
  const AssignmentSummary({
    required this.id,
    required this.clientName,
    required this.locationName,
    required this.shiftName,
    required this.shiftTime,
    required this.radiusMeter,
  });

  final String id;
  final String clientName;
  final String locationName;
  final String shiftName;
  final String shiftTime;
  final int radiusMeter;

  factory AssignmentSummary.fromJson(Map<String, dynamic> json) {
    final client = json['client'] as Map<String, dynamic>? ?? {};
    final location = json['workLocation'] as Map<String, dynamic>? ?? {};
    final shift = json['shift'] as Map<String, dynamic>? ?? {};

    return AssignmentSummary(
      id: json['id']?.toString() ?? '',
      clientName:
          _firstText([client['name'], json['clientName'], json['client']]) ??
          '-',
      locationName:
          _firstText([
            location['name'],
            json['locationName'],
            json['workLocationName'],
          ]) ??
          '-',
      shiftName:
          _firstText([shift['name'], json['shiftName'], json['shift']]) ?? '-',
      shiftTime: _shiftTime(json, shift),
      radiusMeter:
          int.tryParse(
            _firstText([
                  location['geofenceRadiusMeter'],
                  location['radiusMeter'],
                  json['radiusMeter'],
                  json['geofenceRadiusMeter'],
                ]) ??
                '',
          ) ??
          100,
    );
  }
}

class AttendanceSummary {
  const AttendanceSummary({
    required this.status,
    required this.checkInTime,
    required this.checkOutTime,
    required this.lateMinutes,
    required this.workMinutes,
  });

  final String status;
  final String? checkInTime;
  final String? checkOutTime;
  final int lateMinutes;
  final int workMinutes;

  factory AttendanceSummary.fromJson(Map<String, dynamic> json) {
    return AttendanceSummary(
      status: json['status']?.toString() ?? 'PRESENT',
      checkInTime: timeOrNull(json['checkInTime']),
      checkOutTime: timeOrNull(json['checkOutTime']),
      lateMinutes: int.tryParse(json['lateMinutes']?.toString() ?? '') ?? 0,
      workMinutes: int.tryParse(json['workMinutes']?.toString() ?? '') ?? 0,
    );
  }
}

class ActivitySummary {
  const ActivitySummary({required this.title, required this.status});

  final String title;
  final String status;

  factory ActivitySummary.fromJson(Map<String, dynamic> json) {
    return ActivitySummary(
      title: json['title']?.toString() ?? 'Aktivitas',
      status: json['status']?.toString() ?? 'DRAFT',
    );
  }
}

class LeaveSummary {
  const LeaveSummary({required this.type, required this.status});

  final String type;
  final String status;

  factory LeaveSummary.fromJson(Map<String, dynamic> json) {
    return LeaveSummary(
      type: json['type']?.toString() ?? 'LEAVE',
      status: json['status']?.toString() ?? 'SUBMITTED',
    );
  }
}

String todayString() {
  final now = DateTime.now();
  return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
}

String? _firstText(List<Object?> values) {
  for (final value in values) {
    final text = value?.toString().trim();
    if (text != null && text.isNotEmpty && text != 'null') return text;
  }
  return null;
}

String _shiftTime(Map<String, dynamic> assignment, Map<String, dynamic> shift) {
  final direct = _firstText([
    assignment['shiftTime'],
    assignment['timeRange'],
    shift['timeRange'],
  ]);
  if (direct != null) return direct;

  final start = timeOnly(
    _firstText([shift['startTime'], assignment['startTime']]),
  );
  final end = timeOnly(_firstText([shift['endTime'], assignment['endTime']]));
  return '$start - $end';
}

String dateOnly(Object? value) {
  final raw = value?.toString();
  if (raw == null || raw.isEmpty) return '-';
  final match = RegExp(r'(\d{4})-(\d{2})-(\d{2})').firstMatch(raw);
  if (match == null) return raw;
  return '${match.group(1)}-${match.group(2)}-${match.group(3)}';
}

String? timeOrNull(Object? value) {
  final formatted = timeOnly(value);
  return formatted == '--:--' ? null : formatted;
}

String timeOnly(Object? value) {
  final raw = value?.toString();
  if (raw == null || raw.isEmpty) return '--:--';
  final match = RegExp(r'(\d{2}):(\d{2})').firstMatch(raw);
  if (match == null) return '--:--';
  return '${match.group(1)}:${match.group(2)}';
}
