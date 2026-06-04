import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../theme.dart';
import '../widgets/app_version_text.dart';
import 'main_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.onLoginSuccess});

  final void Function({required bool demo})? onLoginSuccess;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(
    text: 'employee@alihdaya.test',
  );
  final _passwordController = TextEditingController(text: 'password123');
  final _baseUrlController = TextEditingController();
  final _api = ApiClient();
  bool _isLoading = false;
  bool _isTestingServer = false;
  String _baseUrl = ApiClient.defaultBaseUrl;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBaseUrl();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _baseUrlController.dispose();
    super.dispose();
  }

  Future<void> _loadBaseUrl() async {
    final baseUrl = await _api.baseUrl;
    if (!mounted) return;
    setState(() {
      _baseUrl = baseUrl;
      _baseUrlController.text = baseUrl;
    });
  }

  Future<void> _login({bool demo = false}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (!demo) {
        await _api.login(_emailController.text, _passwordController.text);
      }

      if (!mounted) return;
      if (widget.onLoginSuccess != null) {
        widget.onLoginSuccess!(demo: demo);
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => MainShell(isDemo: demo)),
        );
      }
    } catch (error) {
      setState(() {
        _error = error is AuthException
            ? 'Aplikasi mobile hanya untuk akun employee.'
            : '$error';
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                alignment: Alignment.centerLeft,
                child: Row(
                  children: [
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        color: brand950,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.business_center_rounded,
                        color: teal500,
                      ),
                    ),
                    const Spacer(),
                    IconButton.filledTonal(
                      tooltip: 'Server API',
                      onPressed: _isLoading ? null : _showServerSheet,
                      icon: const Icon(Icons.dns_outlined),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Alih Daya\nAttendance',
                style: TextStyle(
                  color: brand950,
                  fontSize: 34,
                  height: 1.05,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Absensi GPS, selfie, aktivitas harian, dan izin untuk tenaga kerja lapangan.',
                style: TextStyle(color: mutedText, fontSize: 15, height: 1.55),
              ),
              const SizedBox(height: 34),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Masuk Employee',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: brand950,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _ServerIndicator(baseUrl: _baseUrl),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.mail_outline_rounded),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          prefixIcon: Icon(Icons.lock_outline_rounded),
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Text(
                            _error!,
                            style: const TextStyle(
                              color: Color(0xFFBE123C),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                      ElevatedButton(
                        onPressed: _isLoading ? null : () => _login(),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Masuk'),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _isLoading ? null : () => _login(demo: true),
                        icon: const Icon(Icons.auto_awesome_rounded),
                        label: const Text('Lihat Mode Demo'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          foregroundColor: brand950,
                          side: const BorderSide(color: borderColor),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Row(
                children: [
                  _FeaturePill(icon: Icons.location_on_outlined, label: 'GPS'),
                  SizedBox(width: 8),
                  _FeaturePill(
                    icon: Icons.camera_alt_outlined,
                    label: 'Selfie',
                  ),
                  SizedBox(width: 8),
                  _FeaturePill(
                    icon: Icons.verified_user_outlined,
                    label: 'Approval',
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Center(child: AppVersionText()),
            ],
          ),
        ),
      ),
    );
  }

  void _showServerSheet() {
    _baseUrlController.text = _baseUrl;
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Server API',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: brand950,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Pakai domain API client/VPS. Boleh isi domain saja, app otomatis menambahkan /api/v1.',
                style: TextStyle(color: mutedText, height: 1.5),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _baseUrlController,
                keyboardType: TextInputType.url,
                decoration: const InputDecoration(
                  labelText: 'Base URL',
                  prefixIcon: Icon(Icons.link_rounded),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        await _api.resetBaseUrl();
                        await _loadBaseUrl();
                        if (sheetContext.mounted) Navigator.pop(sheetContext);
                        _showMessage('Server dikembalikan ke default.');
                      },
                      child: const Text('Reset'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isTestingServer
                          ? null
                          : () async {
                              setSheetState(() => _isTestingServer = true);
                              await _saveBaseUrl(closeSheet: false);
                              try {
                                await _api.health();
                                _showMessage('Koneksi API berhasil.');
                              } catch (error) {
                                _showMessage('Koneksi gagal: $error');
                              } finally {
                                if (mounted) {
                                  setSheetState(() => _isTestingServer = false);
                                }
                              }
                            },
                      icon: _isTestingServer
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.wifi_tethering_rounded),
                      label: const Text('Tes'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ElevatedButton(
                onPressed: () => _saveBaseUrl(sheetContext: sheetContext),
                child: const Text('Simpan Server'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _saveBaseUrl({
    BuildContext? sheetContext,
    bool closeSheet = true,
  }) async {
    final normalized = ApiClient.normalizeBaseUrl(_baseUrlController.text);
    await _api.saveBaseUrl(normalized);
    if (!mounted) return;
    setState(() => _baseUrl = normalized);
    if (closeSheet && sheetContext != null && sheetContext.mounted) {
      Navigator.pop(sheetContext);
      _showMessage('Server API disimpan.');
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }
}

class _ServerIndicator extends StatelessWidget {
  const _ServerIndicator({required this.baseUrl});

  final String baseUrl;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: surfaceSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_done_outlined, color: teal700, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              baseUrl,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: mutedText,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturePill extends StatelessWidget {
  const _FeaturePill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 17, color: teal700),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}
