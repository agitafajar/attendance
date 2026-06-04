import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../theme.dart';

class AppVersionText extends StatefulWidget {
  const AppVersionText({super.key, this.align = TextAlign.center});

  final TextAlign align;

  @override
  State<AppVersionText> createState() => _AppVersionTextState();
}

class _AppVersionTextState extends State<AppVersionText> {
  String? _version;

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    setState(() => _version = 'v${info.version}+${info.buildNumber}');
  }

  @override
  Widget build(BuildContext context) {
    final version = _version;
    if (version == null) return const SizedBox.shrink();

    return Text(
      version,
      textAlign: widget.align,
      style: const TextStyle(
        color: mutedText,
        fontSize: 12,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}
