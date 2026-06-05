import 'package:flutter/material.dart';

enum AppThemeMode { light, dark, nordic, cream, sunset }

class AppTheme {
  static ThemeData getTheme(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return _buildTheme(
          brightness: Brightness.light,
          bg: const Color(0xFFF3F6FA),
          fg: const Color(0xFF2C3036),
          cardBg: const Color(0xFFF7F8FA),
          primary: const Color(0xFF0082A8),
          secondary: const Color(0xFFECF0F3),
          accent: const Color(0xFFECF0F3),
        );
      case AppThemeMode.dark:
        return _buildTheme(
          brightness: Brightness.dark,
          bg: const Color(0xFF151B26),
          fg: const Color(0xFFFAFBFC),
          cardBg: const Color(0xFF1A212E),
          primary: const Color(0xFFFAFBFC),
          secondary: const Color(0xFF263040),
          accent: const Color(0xFF263040),
        );
      case AppThemeMode.nordic:
        return _buildTheme(
          brightness: Brightness.dark,
          bg: const Color(0xFF1B1F27),
          fg: const Color(0xFFEAEEF2),
          cardBg: const Color(0xFF222731),
          primary: const Color(0xFF5EC3E7),
          secondary: const Color(0xFF323844),
          accent: const Color(0xFF323844),
        );
      case AppThemeMode.cream:
        return _buildTheme(
          brightness: Brightness.light,
          bg: const Color(0xFFF5EFEB),
          fg: const Color(0xFF2A221C),
          cardBg: const Color(0xFFEBE3D9),
          primary: const Color(0xFFF58210),
          secondary: const Color(0xFFFBF9F6),
          accent: const Color(0xFFEBE3D9),
        );
      case AppThemeMode.sunset:
        return _buildTheme(
          brightness: Brightness.light,
          bg: const Color(0xFFF2EADF),
          fg: const Color(0xFF002947),
          cardBg: const Color(0xFFEFE3D0),
          primary: const Color(0xFFF57800),
          secondary: const Color(0xFFEDC884),
          accent: const Color(0xFFEDC884),
        );
    }
  }

  static ThemeData _buildTheme({
    required Brightness brightness,
    required Color bg,
    required Color fg,
    required Color cardBg,
    required Color primary,
    required Color secondary,
    required Color accent,
  }) {
    final isDark = brightness == Brightness.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: bg,
      primaryColor: primary,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: primary,
        onPrimary: isDark ? Colors.black : Colors.white,
        secondary: secondary,
        onSecondary: fg,
        error: const Color(0xFFCF6679),
        onError: Colors.black,
        surface: cardBg,
        onSurface: fg,
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: fg.withOpacity(0.08),
            width: 1,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: fg.withOpacity(0.12)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: fg.withOpacity(0.12)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: cardBg,
        selectedItemColor: primary,
        unselectedItemColor: fg.withOpacity(0.5),
        elevation: 8,
      ),
      textTheme: TextTheme(
        bodyLarge: TextStyle(color: fg, fontSize: 16),
        bodyMedium: TextStyle(color: fg.withOpacity(0.85), fontSize: 14),
        titleLarge: TextStyle(color: fg, fontSize: 20, fontWeight: FontWeight.bold),
      ),
    );
  }
}
