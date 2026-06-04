import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../api/api_client.dart';
import '../models/mobile_today.dart';
import '../services/device_permission_service.dart';
import '../services/pending_submission_service.dart';
import '../theme.dart';
import '../widgets/app_cards.dart';

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({
    super.key,
    required this.today,
    required this.isDemo,
    required this.onRefresh,
  });

  final MobileToday today;
  final bool isDemo;
  final Future<void> Function() onRefresh;

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
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
                        'Aktivitas',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: brand950,
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Catat pekerjaan harian dan lampirkan foto lapangan.',
                        style: TextStyle(color: mutedText, height: 1.45),
                      ),
                    ],
                  ),
                ),
                IconButton.filled(
                  style: IconButton.styleFrom(backgroundColor: teal700),
                  onPressed: () => _showActivitySheet(context),
                  icon: const Icon(Icons.add_rounded, color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 18),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Hari Ini'),
                  const SizedBox(height: 12),
                  for (final activity in widget.today.activities) ...[
                    _ActivityTile(activity: activity),
                    if (activity != widget.today.activities.last)
                      const Divider(height: 20),
                  ],
                  if (widget.today.activities.isEmpty)
                    const Text(
                      'Belum ada aktivitas.',
                      style: TextStyle(color: mutedText),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            AppCard(
              child: Row(
                children: [
                  _SmallMetric(
                    label: 'Draft',
                    value: _countStatus('DRAFT').toString(),
                  ),
                  _SmallMetric(
                    label: 'Submitted',
                    value: _countStatus('SUBMITTED').toString(),
                  ),
                  _SmallMetric(
                    label: 'Approved',
                    value: _countStatus('APPROVED').toString(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  int _countStatus(String status) {
    return widget.today.activities
        .where((activity) => activity.status == status)
        .length;
  }

  void _showActivitySheet(BuildContext context) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    XFile? photo;

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
                  'Input Aktivitas',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: brand950,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Judul aktivitas',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descriptionController,
                  minLines: 3,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    labelText: 'Deskripsi pekerjaan',
                  ),
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
                      imageQuality: 78,
                      maxWidth: 1400,
                    );
                    if (selected != null) {
                      setSheetState(() => photo = selected);
                    }
                  },
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: Text(photo == null ? 'Tambah Foto' : 'Foto siap'),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _submitActivity(
                          sheetContext,
                          titleController.text,
                          descriptionController.text,
                          'DRAFT',
                          photo,
                        ),
                        child: const Text('Simpan Draft'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _submitActivity(
                          sheetContext,
                          titleController.text,
                          descriptionController.text,
                          'SUBMITTED',
                          photo,
                        ),
                        child: const Text('Kirim'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ).whenComplete(() {
      titleController.dispose();
      descriptionController.dispose();
    });
  }

  Future<void> _submitActivity(
    BuildContext sheetContext,
    String title,
    String description,
    String status,
    XFile? photo,
  ) async {
    final validationError = _validateActivity(title, description);
    if (validationError != null) {
      _showMessage(validationError);
      return;
    }

    Navigator.pop(sheetContext);

    if (widget.isDemo) {
      _showMessage('Aktivitas demo berhasil disimpan.');
      return;
    }

    Position? position;
    try {
      position = await _tryCurrentPosition();
      final photoUrls = <String>[];

      if (photo != null) {
        final upload = await _api.uploadFile(
          path: photo.path,
          type: 'activity',
        );
        final url = upload['url']?.toString();
        if (url != null && url.isNotEmpty) photoUrls.add(url);
      }

      await _api.createActivity(
        activityDate: widget.today.businessDate,
        title: title.trim(),
        description: description.trim(),
        status: status,
        latitude: position?.latitude,
        longitude: position?.longitude,
        photoUrls: photoUrls,
      );

      _showMessage('Aktivitas berhasil disimpan.');
      await widget.onRefresh();
    } on NetworkException catch (error) {
      await _pending.addActivity(
        activityDate: widget.today.businessDate,
        title: title.trim(),
        description: description.trim(),
        status: status,
        latitude: position?.latitude,
        longitude: position?.longitude,
        photoPath: photo?.path,
      );
      _showMessage('${error.message} Aktivitas disimpan pending.');
    } catch (error) {
      _showMessage(error.toString());
    }
  }

  Future<Position?> _tryCurrentPosition() async {
    return _permissions.optionalLocation();
  }

  String? _validateActivity(String title, String description) {
    if (title.trim().length < 3) {
      return 'Judul aktivitas minimal 3 karakter.';
    }
    if (description.trim().length < 5) {
      return 'Deskripsi aktivitas minimal 5 karakter.';
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

class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.activity});

  final ActivitySummary activity;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: surfaceSoft,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.task_alt_rounded, color: teal700),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                activity.title,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  color: brand950,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                StatusStyle.from(activity.status).label,
                style: const TextStyle(
                  color: mutedText,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        StatusPill(label: activity.status),
      ],
    );
  }
}

class _SmallMetric extends StatelessWidget {
  const _SmallMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: mutedText, fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: brand950,
            ),
          ),
        ],
      ),
    );
  }
}
