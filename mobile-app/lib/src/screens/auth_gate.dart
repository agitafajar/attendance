import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'main_shell.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final _api = ApiClient();
  bool _isChecking = true;
  bool _hasSession = false;

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    final token = await _api.token;
    var hasSession = token != null && token.isNotEmpty;

    if (hasSession) {
      try {
        await _api.requireEmployeeSession();
      } on AuthException {
        await _api.clearSession();
        hasSession = false;
      } catch (_) {
        hasSession = true;
      }
    }

    if (!mounted) return;
    setState(() {
      _hasSession = hasSession;
      _isChecking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 34,
                  height: 34,
                  child: CircularProgressIndicator(
                    color: teal700,
                    strokeWidth: 3,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'Menyiapkan aplikasi...',
                  style: TextStyle(
                    color: mutedText,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_hasSession) {
      return MainShell(isDemo: false, onLogout: _handleLogout);
    }

    return LoginScreen(onLoginSuccess: _handleLoginSuccess);
  }

  void _handleLoginSuccess({required bool demo}) {
    setState(() => _hasSession = !demo);
    if (demo) {
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => const MainShell(isDemo: true)));
    }
  }

  Future<void> _handleLogout() async {
    await _api.logout();
    if (!mounted) return;
    setState(() => _hasSession = false);
  }
}
