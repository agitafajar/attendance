import 'package:flutter/material.dart';

import 'screens/auth_gate.dart';
import 'theme.dart';

class AlihDayaMobileApp extends StatelessWidget {
  const AlihDayaMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Alih Daya Attendance',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AuthGate(),
    );
  }
}
