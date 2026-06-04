import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api/api_client.dart';
import '../models/mobile_today.dart';
import '../services/device_permission_service.dart';
import '../services/pending_submission_service.dart';
import '../theme.dart';
import '../widgets/app_cards.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({
    super.key,
    required this.today,
    required this.isDemo,
    required this.onRefresh,
  });

  final MobileToday today;
  final bool isDemo;
  final Future<void> Function() onRefresh;

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  final _api = ApiClient();
  final _picker = ImagePicker();
  final _permissions = DevicePermissionService();
  final _pending = PendingSubmissionService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          children: [
            Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Izin & Cuti',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: brand950,
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Ajukan sakit, izin, atau cuti tahunan ke supervisor.',
                        style: TextStyle(color: mutedText, height: 1.45),
                      ),
                    ],
                  ),
                ),
                IconButton.filled(
                  style: IconButton.styleFrom(backgroundColor: teal700),
                  onPressed: () => _showLeaveSheet(context),
                  icon: const Icon(Icons.add_rounded, color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 18),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Pengajuan Terakhir'),
                  const SizedBox(height: 12),
                  for (final leave in widget.today.leaveRequests) ...[
                    _LeaveTile(leave: leave),
                    if (leave != widget.today.leaveRequests.last)
                      const Divider(height: 20),
                  ],
                  if (widget.today.leaveRequests.isEmpty)
                    const Text(
                      'Belum ada pengajuan.',
                      style: TextStyle(color: mutedText),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            const AppCard(
              child: Row(
                children: [
                  Icon(Icons.verified_user_outlined, color: teal700),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Pengajuan baru langsung masuk ke antrian approval supervisor.',
                      style: TextStyle(
                        color: brand950,
                        fontWeight: FontWeight.w800,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLeaveSheet(BuildContext context) {
    final reasonController = TextEditingController();
    final startDateController = TextEditingController(
      text: widget.today.businessDate,
    );
    final endDateController = TextEditingController(
      text: widget.today.businessDate,
    );
    var selectedType = 'SICK';
    XFile? attachment;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            0,
            20,
            MediaQuery.of(sheetContext).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ajukan Izin',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: brand950,
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: selectedType,
                  items: const [
                    DropdownMenuItem(value: 'SICK', child: Text('Sakit')),
                    DropdownMenuItem(value: 'LEAVE', child: Text('Izin')),
                    DropdownMenuItem(
                      value: 'ANNUAL',
                      child: Text('Cuti Tahunan'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setSheetState(() => selectedType = value);
                    }
                  },
                  decoration: const InputDecoration(labelText: 'Tipe'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: startDateController,
                  readOnly: true,
                  decoration: const InputDecoration(
                    labelText: 'Tanggal mulai',
                    suffixIcon: Icon(Icons.calendar_today_rounded),
                  ),
                  onTap: () => _pickDate(sheetContext, startDateController),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: endDateController,
                  readOnly: true,
                  decoration: const InputDecoration(
                    labelText: 'Tanggal akhir',
                    suffixIcon: Icon(Icons.calendar_today_rounded),
                  ),
                  onTap: () => _pickDate(sheetContext, endDateController),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: reasonController,
                  minLines: 3,
                  maxLines: 5,
                  decoration: const InputDecoration(labelText: 'Alasan'),
                ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () async {
                    try {
                      await _permissions.ensureCamera();
                    } catch (error) {
                      _showMessage(error.toString());
                      return;
                    }
                    final selected = await _picker.pickImage(
                      source: ImageSource.camera,
                      imageQuality: 80,
                      maxWidth: 1400,
                    );
                    if (selected != null) {
                      setSheetState(() => attachment = selected);
                    }
                  },
                  icon: const Icon(Icons.attach_file_rounded),
                  label: Text(
                    attachment == null ? 'Lampirkan bukti' : 'Bukti siap',
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => _submitLeave(
                    sheetContext,
                    selectedType,
                    startDateController.text,
                    endDateController.text,
                    reasonController.text,
                    attachment,
                  ),
                  child: const Text('Kirim Pengajuan'),
                ),
              ],
            ),
          ),
        ),
      ),
    ).whenComplete(() {
      reasonController.dispose();
      startDateController.dispose();
      endDateController.dispose();
    });
  }

  Future<void> _pickDate(
    BuildContext context,
    TextEditingController controller,
  ) async {
    final initial = DateTime.tryParse(controller.text) ?? DateTime.now();
    final selected = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (selected != null) {
      controller.text = _dateString(selected);
    }
  }

  Future<void> _submitLeave(
    BuildContext sheetContext,
    String type,
    String startDate,
    String endDate,
    String reason,
    XFile? attachment,
  ) async {
    final validationError = _validateLeave(startDate, endDate, reason);
    if (validationError != null) {
      _showMessage(validationError);
      return;
    }

    Navigator.pop(sheetContext);

    if (widget.isDemo) {
      _showMessage('Pengajuan demo berhasil dikirim.');
      return;
    }

    try {
      String? attachmentUrl;
      if (attachment != null) {
        final upload = await _api.uploadFile(
          path: attachment.path,
          type: 'leave',
        );
        attachmentUrl = upload['url']?.toString();
      }

      await _api.createLeaveRequest(
        type: type,
        startDate: startDate,
        endDate: endDate,
        reason: reason.trim(),
        attachmentUrl: attachmentUrl,
      );

      _showMessage('Pengajuan berhasil dikirim.');
      await widget.onRefresh();
    } on NetworkException catch (error) {
      await _pending.addLeave(
        type: type,
        startDate: startDate,
        endDate: endDate,
        reason: reason.trim(),
        attachmentPath: attachment?.path,
      );
      _showMessage('${error.message} Pengajuan disimpan pending.');
    } catch (error) {
      _showMessage(error.toString());
    }
  }

  String _dateString(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  String? _validateLeave(String startDate, String endDate, String reason) {
    final start = DateTime.tryParse(startDate);
    final end = DateTime.tryParse(endDate);

    if (start == null) {
      return 'Tanggal mulai belum valid.';
    }
    if (end == null) {
      return 'Tanggal akhir belum valid.';
    }
    if (end.isBefore(start)) {
      return 'Tanggal akhir tidak boleh sebelum tanggal mulai.';
    }
    if (reason.trim().length < 5) {
      return 'Alasan izin minimal 5 karakter.';
    }
    return null;
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }
}

class _LeaveTile extends StatelessWidget {
  const _LeaveTile({required this.leave});

  final LeaveSummary leave;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: const Color(0xFFFFF7ED),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.event_note_rounded, color: Color(0xFFB45309)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                StatusStyle.from(leave.type).label,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  color: brand950,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Menunggu/hasil approval supervisor',
                style: TextStyle(color: mutedText, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
        StatusPill(label: leave.status),
      ],
    );
  }
}
