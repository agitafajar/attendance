import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../models/mobile_today.dart';
import '../theme.dart';
import 'activity_screen.dart';
import 'history_screen.dart';
import 'home_screen.dart';
import 'leave_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.isDemo, this.onLogout});

  final bool isDemo;
  final Future<void> Function()? onLogout;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  final _api = ApiClient();
  int _selectedIndex = 0;
  bool _isLoading = true;
  String? _error;
  MobileToday _today = MobileToday.demo();

  @override
  void initState() {
    super.initState();
    _loadToday();
  }

  Future<void> _loadToday() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (widget.isDemo) {
        await Future<void>.delayed(const Duration(milliseconds: 450));
        _today = MobileToday.demo();
      } else {
        final json = await _api.getJson('/mobile/today');
        _today = MobileToday.fromJson(json);
      }
    } on AuthException {
      await _handleExpiredSession();
      return;
    } catch (error) {
      _today = MobileToday.demo();
      final message = error is ApiException
          ? error.message
          : 'Data hari ini belum bisa dimuat.';
      _error = '$message Menampilkan data demo sementara.';
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(
        today: _today,
        isLoading: _isLoading,
        error: _error,
        isDemo: widget.isDemo,
        onRefresh: _loadToday,
      ),
      ActivityScreen(
        today: _today,
        isDemo: widget.isDemo,
        onRefresh: _loadToday,
      ),
      LeaveScreen(today: _today, isDemo: widget.isDemo, onRefresh: _loadToday),
      HistoryScreen(
        today: _today,
        isDemo: widget.isDemo,
        onLogout: widget.onLogout,
      ),
    ];

    return Scaffold(
      body: pages[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        height: 72,
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFE0F2F1),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.task_outlined),
            selectedIcon: Icon(Icons.task_rounded),
            label: 'Aktivitas',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_note_outlined),
            selectedIcon: Icon(Icons.event_note_rounded),
            label: 'Izin',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_rounded),
            selectedIcon: Icon(Icons.history_rounded),
            label: 'Riwayat',
          ),
        ],
      ),
    );
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
}

class AppScreen extends StatelessWidget {
  const AppScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: teal700,
          onRefresh: () async {},
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: brand950,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          color: mutedText,
                          fontSize: 14,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 6, 20, 26),
                sliver: SliverList.separated(
                  itemCount: children.length,
                  itemBuilder: (_, index) => children[index],
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 14),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
