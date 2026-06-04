import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../models/mobile_history.dart';
import '../models/mobile_today.dart';
import '../services/pending_submission_service.dart';
import '../theme.dart';
import '../widgets/app_cards.dart';
import '../widgets/app_version_text.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({
    super.key,
    required this.today,
    required this.isDemo,
    this.onLogout,
  });

  final MobileToday today;
  final bool isDemo;
  final Future<void> Function()? onLogout;

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _api = ApiClient();
  final _pending = PendingSubmissionService();
  MobileHistory _history = MobileHistory.demo();
  bool _isLoading = true;
  bool _isSyncingPending = false;
  bool _isLoggingOut = false;
  String? _error;
  int _pendingCount = 0;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (widget.isDemo) {
        await Future<void>.delayed(const Duration(milliseconds: 350));
        _history = MobileHistory.demo();
      } else {
        _history = await _api.getMobileHistory(limit: 12);
      }
    } on AuthException {
      await _handleExpiredSession();
      return;
    } catch (error) {
      _history = MobileHistory.demo();
      final message = error is ApiException
          ? error.message
          : 'Riwayat belum bisa dimuat.';
      _error = '$message Menampilkan data demo sementara.';
    } finally {
      final pendingCount = await _pending.count();
      if (mounted) {
        setState(() {
          _pendingCount = pendingCount;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tabs = ['Absensi', 'Aktivitas', 'Izin'];

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: teal700,
          onRefresh: _loadHistory,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            children: [
              const Text(
                'Riwayat',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: brand950,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Pantau rekam kerja, laporan aktivitas, dan izin employee.',
                style: TextStyle(color: mutedText, height: 1.45),
              ),
              const SizedBox(height: 18),
              _ProfileCard(
                today: widget.today,
                isDemo: widget.isDemo,
                isLoggingOut: _isLoggingOut,
                onLogout: _logout,
              ),
              const SizedBox(height: 14),
              if (_isLoading) const _SoftNotice(text: 'Memuat riwayat...'),
              if (_error != null) _SoftNotice(text: _error!, isWarning: true),
              if (_isLoading || _error != null) const SizedBox(height: 14),
              if (_pendingCount > 0) ...[
                _PendingSyncCard(
                  count: _pendingCount,
                  isSyncing: _isSyncingPending,
                  onSync: _syncPending,
                ),
                const SizedBox(height: 14),
              ],
              _StatsRow(history: _history),
              const SizedBox(height: 14),
              AppCard(
                padding: const EdgeInsets.all(6),
                child: Row(
                  children: [
                    for (var i = 0; i < tabs.length; i++)
                      Expanded(
                        child: _TabButton(
                          label: tabs[i],
                          selected: _tabIndex == i,
                          onTap: () => setState(() => _tabIndex = i),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (_tabIndex == 0) _AttendanceList(items: _history.attendances),
              if (_tabIndex == 1) _ActivityList(items: _history.activities),
              if (_tabIndex == 2) _LeaveList(items: _history.leaves),
              const SizedBox(height: 14),
              _PlacementCard(today: widget.today),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _logout() async {
    if (widget.isDemo) {
      Navigator.of(context).pop();
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Keluar dari aplikasi?'),
        content: const Text(
          'Session di perangkat ini akan diakhiri dan token login dicabut.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoggingOut = true);
    await widget.onLogout?.call();
    if (mounted) setState(() => _isLoggingOut = false);
  }

  Future<void> _handleExpiredSession() async {
    await widget.onLogout?.call();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Session berakhir. Silakan login ulang.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _syncPending() async {
    if (_isSyncingPending || widget.isDemo) return;

    setState(() => _isSyncingPending = true);
    try {
      final result = await _pending.syncAll(_api);
      if (!mounted) return;
      setState(() => _pendingCount = result.remaining);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${result.synced} pending berhasil dikirim. Sisa ${result.remaining}.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      await _loadHistory();
    } on AuthException {
      await _handleExpiredSession();
    } catch (error) {
      if (!mounted) return;
      final message = error is ApiException
          ? error.message
          : 'Pending belum bisa disinkronkan.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
      );
    } finally {
      if (mounted) setState(() => _isSyncingPending = false);
    }
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({
    required this.today,
    required this.isDemo,
    required this.isLoggingOut,
    required this.onLogout,
  });

  final MobileToday today;
  final bool isDemo;
  final bool isLoggingOut;
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: brand950,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.person_rounded, color: teal500),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  today.employeeName,
                  style: const TextStyle(
                    color: brand950,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${today.employeeNumber} - ${today.position}',
                  style: const TextStyle(
                    color: mutedText,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                const AppVersionText(align: TextAlign.left),
              ],
            ),
          ),
          IconButton(
            tooltip: isDemo ? 'Keluar demo' : 'Logout',
            onPressed: isLoggingOut ? null : onLogout,
            icon: isLoggingOut
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(
                    isDemo ? Icons.close_rounded : Icons.logout_rounded,
                    color: mutedText,
                  ),
          ),
        ],
      ),
    );
  }
}

class _PendingSyncCard extends StatelessWidget {
  const _PendingSyncCard({
    required this.count,
    required this.isSyncing,
    required this.onSync,
  });

  final int count;
  final bool isSyncing;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.cloud_upload_outlined,
              color: Color(0xFFB45309),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$count data pending',
                  style: const TextStyle(
                    color: brand950,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Kirim ulang saat koneksi sudah stabil.',
                  style: TextStyle(
                    color: mutedText,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          TextButton(
            onPressed: isSyncing ? null : onSync,
            child: Text(isSyncing ? 'Kirim...' : 'Sinkron'),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.history});

  final MobileHistory history;

  @override
  Widget build(BuildContext context) {
    final presentCount = history.attendances
        .where((item) => item.status == 'PRESENT')
        .length;
    final lateCount = history.attendances
        .where((item) => item.status == 'LATE')
        .length;

    return AppCard(
      child: Row(
        children: [
          _MiniStat(label: 'Hadir', value: '$presentCount'),
          _MiniStat(label: 'Telat', value: '$lateCount'),
          _MiniStat(label: 'Laporan', value: '${history.activities.length}'),
        ],
      ),
    );
  }
}

class _AttendanceList extends StatelessWidget {
  const _AttendanceList({required this.items});

  final List<AttendanceHistoryItem> items;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Riwayat Absensi'),
          const SizedBox(height: 12),
          if (items.isEmpty)
            const _EmptyText(text: 'Belum ada riwayat absensi.'),
          for (final item in items) ...[
            _HistoryTile(
              icon: Icons.work_history_rounded,
              title: '${item.clientName} - ${item.locationName}',
              detail:
                  '${item.date} | ${item.checkInTime ?? '--:--'} - ${item.checkOutTime ?? '--:--'}',
              trailing: StatusPill(label: item.status),
            ),
            if (item != items.last) const Divider(height: 20),
          ],
        ],
      ),
    );
  }
}

class _ActivityList extends StatelessWidget {
  const _ActivityList({required this.items});

  final List<ActivityHistoryItem> items;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Riwayat Aktivitas'),
          const SizedBox(height: 12),
          if (items.isEmpty) const _EmptyText(text: 'Belum ada aktivitas.'),
          for (final item in items) ...[
            _HistoryTile(
              icon: Icons.task_alt_rounded,
              title: item.title,
              detail: '${item.date} | ${item.photoCount} foto',
              trailing: StatusPill(label: item.status),
            ),
            if (item != items.last) const Divider(height: 20),
          ],
        ],
      ),
    );
  }
}

class _LeaveList extends StatelessWidget {
  const _LeaveList({required this.items});

  final List<LeaveHistoryItem> items;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Riwayat Izin'),
          const SizedBox(height: 12),
          if (items.isEmpty)
            const _EmptyText(text: 'Belum ada pengajuan izin.'),
          for (final item in items) ...[
            _HistoryTile(
              icon: Icons.event_note_rounded,
              title: StatusStyle.from(item.type).label,
              detail: '${item.startDate} sampai ${item.endDate}',
              trailing: StatusPill(label: item.status),
            ),
            if (item != items.last) const Divider(height: 20),
          ],
        ],
      ),
    );
  }
}

class _PlacementCard extends StatelessWidget {
  const _PlacementCard({required this.today});

  final MobileToday today;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Penempatan Aktif'),
          const SizedBox(height: 12),
          _InfoLine(
            label: 'Client',
            value: today.assignment?.clientName ?? '-',
          ),
          _InfoLine(
            label: 'Lokasi',
            value: today.assignment?.locationName ?? '-',
          ),
          _InfoLine(label: 'Shift', value: today.assignment?.shiftTime ?? '-'),
        ],
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({
    required this.icon,
    required this.title,
    required this.detail,
    required this.trailing,
  });

  final IconData icon;
  final String title;
  final String detail;
  final Widget trailing;

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
          child: Icon(icon, color: teal700),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  color: brand950,
                ),
              ),
              const SizedBox(height: 4),
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
        const SizedBox(width: 10),
        trailing,
      ],
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Container(
        height: 42,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? brand950 : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : mutedText,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});

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
              color: brand950,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(color: mutedText)),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                color: brand950,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SoftNotice extends StatelessWidget {
  const _SoftNotice({required this.text, this.isWarning = false});

  final String text;
  final bool isWarning;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isWarning ? const Color(0xFFFFF7ED) : const Color(0xFFE0F2F1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: isWarning ? const Color(0xFF92400E) : teal700,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _EmptyText extends StatelessWidget {
  const _EmptyText({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(color: mutedText));
  }
}
