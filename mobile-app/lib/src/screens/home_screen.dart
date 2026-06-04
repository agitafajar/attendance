import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api/api_client.dart';
import '../models/mobile_today.dart';
import '../services/device_permission_service.dart';
import '../theme.dart';
import '../widgets/app_cards.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.today,
    required this.isLoading,
    required this.error,
    required this.isDemo,
    required this.onRefresh,
  });

  final MobileToday today;
  final bool isLoading;
  final String? error;
  final bool isDemo;
  final Future<void> Function() onRefresh;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiClient();
  final _picker = ImagePicker();
  final _permissions = DevicePermissionService();
  bool _isSubmittingAttendance = false;

  @override
  Widget build(BuildContext context) {
    final assignment = widget.today.assignment;
    final attendance = widget.today.attendance;
    final attendanceAction = _attendanceAction(assignment, attendance);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: teal700,
          onRefresh: widget.onRefresh,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Selamat bekerja,',
                          style: TextStyle(color: mutedText, fontSize: 14),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.today.employeeName,
                          style: const TextStyle(
                            color: brand950,
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: brand950,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.badge_outlined, color: teal500),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              if (widget.isLoading)
                const _InfoBanner(
                  icon: Icons.sync_rounded,
                  text: 'Memuat data hari ini...',
                  color: teal700,
                  background: Color(0xFFE0F2F1),
                ),
              if (widget.error != null)
                _InfoBanner(
                  icon: Icons.info_outline_rounded,
                  text: widget.error!,
                  color: const Color(0xFF92400E),
                  background: const Color(0xFFFFF7ED),
                ),
              if (widget.isLoading || widget.error != null)
                const SizedBox(height: 14),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Assignment Hari Ini',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: brand950,
                            ),
                          ),
                        ),
                        StatusPill(label: attendance?.status ?? 'READY'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _AssignmentLine(
                      icon: Icons.business_rounded,
                      label: assignment?.clientName ?? '-',
                      detail: assignment?.locationName ?? '-',
                    ),
                    const SizedBox(height: 12),
                    _AssignmentLine(
                      icon: Icons.schedule_rounded,
                      label: assignment?.shiftName ?? '-',
                      detail: assignment?.shiftTime ?? '-',
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton.icon(
                      onPressed:
                          _isSubmittingAttendance || !attendanceAction.enabled
                          ? null
                          : () => _showCheckDialog(
                              context,
                              attendanceAction.actionLabel,
                            ),
                      icon: Icon(
                        _isSubmittingAttendance
                            ? Icons.sync_rounded
                            : attendanceAction.icon,
                      ),
                      label: Text(
                        _isSubmittingAttendance
                            ? 'Memproses...'
                            : attendanceAction.buttonLabel,
                      ),
                    ),
                    if (attendanceAction.note != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        attendanceAction.note!,
                        style: const TextStyle(
                          color: mutedText,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionHeader(title: 'Validasi Lokasi'),
                    const SizedBox(height: 14),
                    Container(
                      height: 122,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0F2F1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: 20,
                            top: 20,
                            child: Container(
                              width: 76,
                              height: 76,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: teal600, width: 2),
                                color: Colors.white.withValues(alpha: 0.38),
                              ),
                            ),
                          ),
                          const Positioned(
                            left: 16,
                            top: 16,
                            child: Icon(
                              Icons.location_on_rounded,
                              color: teal700,
                              size: 34,
                            ),
                          ),
                          Positioned(
                            left: 16,
                            bottom: 18,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Dalam radius lokasi',
                                  style: TextStyle(
                                    color: brand950,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Radius ${assignment?.radiusMeter ?? 100} meter aktif',
                                  style: const TextStyle(
                                    color: mutedText,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  QuickAction(
                    icon: Icons.add_task_rounded,
                    label: 'Aktivitas',
                    onTap: () => _showComingSoon(context, 'Input aktivitas'),
                  ),
                  const SizedBox(width: 10),
                  QuickAction(
                    icon: Icons.camera_alt_outlined,
                    label: 'Selfie',
                    onTap: () => _showComingSoon(context, 'Upload selfie'),
                  ),
                  const SizedBox(width: 10),
                  QuickAction(
                    icon: Icons.event_note_outlined,
                    label: 'Izin',
                    onTap: () => _showComingSoon(context, 'Pengajuan izin'),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              AppCard(
                child: Row(
                  children: [
                    _StatBox(
                      label: 'Aktivitas',
                      value: '${widget.today.activities.length}',
                    ),
                    const SizedBox(width: 10),
                    _StatBox(
                      label: 'Izin Aktif',
                      value: '${widget.today.leaveRequests.length}',
                    ),
                    const SizedBox(width: 10),
                    _StatBox(
                      label: 'Telat',
                      value: '${attendance?.lateMinutes ?? 0}m',
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCheckDialog(BuildContext context, String action) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              action,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: brand950,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Ambil lokasi GPS dan selfie sebagai bukti kehadiran. Data akan divalidasi dengan radius lokasi kerja.',
              style: TextStyle(color: mutedText, height: 1.5),
            ),
            const SizedBox(height: 14),
            _CheckStep(
              icon: Icons.my_location_rounded,
              title: 'GPS aktif',
              detail: 'Koordinat dikirim untuk validasi geofence.',
            ),
            const SizedBox(height: 10),
            _CheckStep(
              icon: Icons.camera_alt_outlined,
              title: 'Selfie lapangan',
              detail: 'Foto diupload dulu, lalu URL masuk ke absensi.',
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _submitAttendance(action);
              },
              child: Text('Konfirmasi $action'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitAttendance(String action) async {
    final actionState = _attendanceAction(
      widget.today.assignment,
      widget.today.attendance,
    );
    if (!actionState.enabled) {
      _showMessage(actionState.note ?? 'Absensi belum bisa diproses.');
      return;
    }

    if (widget.isDemo) {
      _showMessage('$action demo berhasil. Login real untuk kirim ke server.');
      return;
    }

    if (action == 'Check In' && _realAssignmentId == null) {
      _showMessage('Assignment aktif belum tersedia.');
      return;
    }

    setState(() => _isSubmittingAttendance = true);
    try {
      final position = await _permissions.requiredLocation();
      await _permissions.ensureCamera();
      final photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 78,
        maxWidth: 1400,
      );

      if (photo == null) {
        _showMessage('Selfie dibatalkan. $action belum dikirim.');
        return;
      }

      final upload = await _api.uploadFile(
        path: photo.path,
        type: 'attendance',
      );
      final photoUrl = upload['url']?.toString();
      if (photoUrl == null || photoUrl.isEmpty) {
        throw ApiException('Upload berhasil tapi URL foto tidak ditemukan.');
      }

      if (action == 'Check In') {
        await _api.checkIn(
          attendanceDate: widget.today.businessDate,
          assignmentId: _realAssignmentId,
          latitude: position.latitude,
          longitude: position.longitude,
          photoUrl: photoUrl,
        );
      } else {
        await _api.checkOut(
          attendanceDate: widget.today.businessDate,
          latitude: position.latitude,
          longitude: position.longitude,
          photoUrl: photoUrl,
        );
      }

      _showMessage('$action berhasil dikirim.');
      await widget.onRefresh();
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() => _isSubmittingAttendance = false);
      }
    }
  }

  String? get _realAssignmentId {
    final id = widget.today.assignment?.id;
    if (id == null || id.isEmpty || id == 'demo-assignment') return null;
    return id;
  }

  _AttendanceAction _attendanceAction(
    AssignmentSummary? assignment,
    AttendanceSummary? attendance,
  ) {
    if (assignment == null) {
      return const _AttendanceAction(
        enabled: false,
        actionLabel: 'Check In',
        buttonLabel: 'Tidak Ada Assignment',
        icon: Icons.event_busy_rounded,
        note: 'Hubungi admin jika hari ini seharusnya ada penempatan kerja.',
      );
    }

    if (attendance?.checkOutTime != null) {
      return const _AttendanceAction(
        enabled: false,
        actionLabel: 'Check Out',
        buttonLabel: 'Selesai Hari Ini',
        icon: Icons.check_circle_outline_rounded,
        note: 'Absensi hari ini sudah lengkap.',
      );
    }

    if (attendance?.checkInTime != null) {
      return const _AttendanceAction(
        enabled: true,
        actionLabel: 'Check Out',
        buttonLabel: 'Check Out',
        icon: Icons.logout_rounded,
      );
    }

    return const _AttendanceAction(
      enabled: true,
      actionLabel: 'Check In',
      buttonLabel: 'Check In',
      icon: Icons.login_rounded,
    );
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  void _showComingSoon(BuildContext context, String title) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('$title siap disambungkan ke API.')));
  }
}

class _CheckStep extends StatelessWidget {
  const _CheckStep({
    required this.icon,
    required this.title,
    required this.detail,
  });

  final IconData icon;
  final String title;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: surfaceSoft,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: teal700, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: brand950,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                detail,
                style: const TextStyle(
                  color: mutedText,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _AttendanceAction {
  const _AttendanceAction({
    required this.enabled,
    required this.actionLabel,
    required this.buttonLabel,
    required this.icon,
    this.note,
  });

  final bool enabled;
  final String actionLabel;
  final String buttonLabel;
  final IconData icon;
  final String? note;
}

class _AssignmentLine extends StatelessWidget {
  const _AssignmentLine({
    required this.icon,
    required this.label,
    required this.detail,
  });

  final IconData icon;
  final String label;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: surfaceSoft,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: teal700, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: brand950,
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                detail,
                style: const TextStyle(
                  color: mutedText,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({
    required this.icon,
    required this.text,
    required this.color,
    required this.background,
  });

  final IconData icon;
  final String text;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: color, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: surfaceSoft,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: mutedText, fontSize: 12)),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(
                color: brand950,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
