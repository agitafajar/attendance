import 'mobile_today.dart';

class MobileHistory {
  const MobileHistory({
    required this.attendances,
    required this.activities,
    required this.leaves,
  });

  final List<AttendanceHistoryItem> attendances;
  final List<ActivityHistoryItem> activities;
  final List<LeaveHistoryItem> leaves;

  factory MobileHistory.demo() {
    return const MobileHistory(
      attendances: [
        AttendanceHistoryItem(
          date: '2026-06-03',
          status: 'PRESENT',
          checkInTime: '08:01',
          checkOutTime: null,
          clientName: 'PT Bank ABC',
          locationName: 'Cabang Medan',
          workMinutes: 0,
        ),
        AttendanceHistoryItem(
          date: '2026-06-02',
          status: 'PRESENT',
          checkInTime: '07:56',
          checkOutTime: '17:04',
          clientName: 'PT Bank ABC',
          locationName: 'Cabang Medan',
          workMinutes: 548,
        ),
        AttendanceHistoryItem(
          date: '2026-06-01',
          status: 'LATE',
          checkInTime: '08:17',
          checkOutTime: '17:00',
          clientName: 'PT Bank ABC',
          locationName: 'Cabang Medan',
          workMinutes: 523,
        ),
      ],
      activities: [
        ActivityHistoryItem(
          date: '2026-06-03',
          title: 'Patroli area lobby',
          status: 'DRAFT',
          photoCount: 0,
        ),
        ActivityHistoryItem(
          date: '2026-06-02',
          title: 'Pengecekan akses tamu',
          status: 'SUBMITTED',
          photoCount: 1,
        ),
      ],
      leaves: [
        LeaveHistoryItem(
          startDate: '2026-05-24',
          endDate: '2026-05-24',
          type: 'SICK',
          status: 'APPROVED',
        ),
      ],
    );
  }
}

class AttendanceHistoryItem {
  const AttendanceHistoryItem({
    required this.date,
    required this.status,
    required this.checkInTime,
    required this.checkOutTime,
    required this.clientName,
    required this.locationName,
    required this.workMinutes,
  });

  final String date;
  final String status;
  final String? checkInTime;
  final String? checkOutTime;
  final String clientName;
  final String locationName;
  final int workMinutes;

  factory AttendanceHistoryItem.fromJson(Map<String, dynamic> json) {
    final assignment = json['assignment'] as Map<String, dynamic>? ?? {};
    final client = assignment['client'] as Map<String, dynamic>? ?? {};
    final location = assignment['workLocation'] as Map<String, dynamic>? ?? {};

    return AttendanceHistoryItem(
      date: dateOnly(json['attendanceDate']),
      status: json['status']?.toString() ?? 'PRESENT',
      checkInTime: timeOrNull(json['checkInTime']),
      checkOutTime: timeOrNull(json['checkOutTime']),
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
      workMinutes: int.tryParse(json['workMinutes']?.toString() ?? '') ?? 0,
    );
  }
}

class ActivityHistoryItem {
  const ActivityHistoryItem({
    required this.date,
    required this.title,
    required this.status,
    required this.photoCount,
  });

  final String date;
  final String title;
  final String status;
  final int photoCount;

  factory ActivityHistoryItem.fromJson(Map<String, dynamic> json) {
    final photos = json['photos'] as List<dynamic>? ?? [];

    return ActivityHistoryItem(
      date: dateOnly(json['activityDate']),
      title: json['title']?.toString() ?? 'Aktivitas',
      status: json['status']?.toString() ?? 'DRAFT',
      photoCount: photos.length,
    );
  }
}

class LeaveHistoryItem {
  const LeaveHistoryItem({
    required this.startDate,
    required this.endDate,
    required this.type,
    required this.status,
  });

  final String startDate;
  final String endDate;
  final String type;
  final String status;

  factory LeaveHistoryItem.fromJson(Map<String, dynamic> json) {
    return LeaveHistoryItem(
      startDate: dateOnly(json['startDate']),
      endDate: dateOnly(json['endDate']),
      type: json['type']?.toString() ?? 'LEAVE',
      status: json['status']?.toString() ?? 'SUBMITTED',
    );
  }
}

String? _firstText(List<Object?> values) {
  for (final value in values) {
    final text = value?.toString().trim();
    if (text != null && text.isNotEmpty && text != 'null') return text;
  }
  return null;
}
