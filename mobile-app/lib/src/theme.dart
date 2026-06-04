import 'package:flutter/material.dart';

const brand950 = Color(0xFF0F172A);
const brand900 = Color(0xFF172033);
const brand800 = Color(0xFF1F2A44);
const teal700 = Color(0xFF0F766E);
const teal600 = Color(0xFF0D9488);
const teal500 = Color(0xFF14B8A6);
const amber500 = Color(0xFFF6C85F);
const surfaceSoft = Color(0xFFF1F5F3);
const borderColor = Color(0xFFE1E7E4);
const mutedText = Color(0xFF69736F);

ThemeData buildAppTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: teal700,
    primary: teal700,
    secondary: amber500,
    surface: Colors.white,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: const Color(0xFFF7F9F8),
    fontFamily: 'Roboto',
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontWeight: FontWeight.w800, color: brand950),
      headlineMedium: TextStyle(fontWeight: FontWeight.w800, color: brand950),
      titleLarge: TextStyle(fontWeight: FontWeight.w800, color: brand950),
      titleMedium: TextStyle(fontWeight: FontWeight.w700, color: brand950),
      bodyLarge: TextStyle(color: brand900),
      bodyMedium: TextStyle(color: brand900),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: borderColor),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: teal600, width: 1.4),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: teal700,
        foregroundColor: Colors.white,
        elevation: 0,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
      ),
    ),
  );
}
