import 'package:flutter/material.dart';

import '../theme.dart';

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: brand950.withValues(alpha: 0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({
    super.key,
    required this.label,
    this.color,
    this.background,
  });

  final String label;
  final Color? color;
  final Color? background;

  @override
  Widget build(BuildContext context) {
    final style = StatusStyle.from(label);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: background ?? style.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        style.label,
        style: TextStyle(
          color: color ?? style.color,
          fontSize: 12,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class StatusStyle {
  const StatusStyle({
    required this.label,
    required this.color,
    required this.background,
  });

  final String label;
  final Color color;
  final Color background;

  factory StatusStyle.from(String rawStatus) {
    final status = rawStatus.trim().toUpperCase();

    switch (status) {
      case 'PRESENT':
        return const StatusStyle(
          label: 'Hadir',
          color: teal700,
          background: Color(0xFFE0F2F1),
        );
      case 'LATE':
        return const StatusStyle(
          label: 'Telat',
          color: Color(0xFFB45309),
          background: Color(0xFFFFF7ED),
        );
      case 'ABSENT':
        return const StatusStyle(
          label: 'Absen',
          color: Color(0xFFBE123C),
          background: Color(0xFFFFF1F2),
        );
      case 'READY':
        return const StatusStyle(
          label: 'Siap',
          color: teal700,
          background: Color(0xFFE0F2F1),
        );
      case 'DRAFT':
        return const StatusStyle(
          label: 'Draft',
          color: Color(0xFF475569),
          background: Color(0xFFF1F5F9),
        );
      case 'SUBMITTED':
      case 'PENDING':
        return const StatusStyle(
          label: 'Menunggu',
          color: Color(0xFFB45309),
          background: Color(0xFFFFF7ED),
        );
      case 'APPROVED':
        return const StatusStyle(
          label: 'Disetujui',
          color: teal700,
          background: Color(0xFFE0F2F1),
        );
      case 'REJECTED':
        return const StatusStyle(
          label: 'Ditolak',
          color: Color(0xFFBE123C),
          background: Color(0xFFFFF1F2),
        );
      case 'CANCELLED':
        return const StatusStyle(
          label: 'Dibatalkan',
          color: Color(0xFF475569),
          background: Color(0xFFF1F5F9),
        );
      case 'SICK':
        return const StatusStyle(
          label: 'Sakit',
          color: Color(0xFFB45309),
          background: Color(0xFFFFF7ED),
        );
      case 'LEAVE':
        return const StatusStyle(
          label: 'Izin',
          color: teal700,
          background: Color(0xFFE0F2F1),
        );
      case 'ANNUAL':
        return const StatusStyle(
          label: 'Cuti',
          color: Color(0xFF1D4ED8),
          background: Color(0xFFEFF6FF),
        );
      default:
        return StatusStyle(
          label: _titleCase(rawStatus.replaceAll('_', ' ')),
          color: teal700,
          background: const Color(0xFFE0F2F1),
        );
    }
  }

  static String _titleCase(String value) {
    return value
        .trim()
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .map((word) {
          final lower = word.toLowerCase();
          return '${lower[0].toUpperCase()}${lower.substring(1)}';
        })
        .join(' ');
  }
}

class QuickAction extends StatelessWidget {
  const QuickAction({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            children: [
              Icon(icon, color: teal700, size: 22),
              const SizedBox(height: 8),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: brand950,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.action});

  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w900,
              color: brand950,
            ),
          ),
        ),
        ?action,
      ],
    );
  }
}
