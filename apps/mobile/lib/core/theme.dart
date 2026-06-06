import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum AppThemeMode { light, dark, nordic, cream, sunset }

class AppTheme {
  static ThemeData getTheme(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return _buildTheme(
          brightness: Brightness.light,
          bg: const Color(0xFFF5F7FA),
          fg: const Color(0xFF1A1D23),
          cardBg: Colors.white,
          primary: const Color(0xFF3D5AFE),
          secondary: const Color(0xFFE8EDF5),
          accent: const Color(0xFF00BFA5),
        );
      case AppThemeMode.dark:
        return _buildTheme(
          brightness: Brightness.dark,
          bg: const Color(0xFF0F1318),
          fg: const Color(0xFFF0F2F5),
          cardBg: const Color(0xFF1A1F2B),
          primary: const Color(0xFF7B8CFF),
          secondary: const Color(0xFF242A38),
          accent: const Color(0xFF64FFDA),
        );
      case AppThemeMode.nordic:
        return _buildTheme(
          brightness: Brightness.dark,
          bg: const Color(0xFF1C2028),
          fg: const Color(0xFFE4E8EE),
          cardBg: const Color(0xFF252A34),
          primary: const Color(0xFF5EC4E8),
          secondary: const Color(0xFF2E3440),
          accent: const Color(0xFF88C0D0),
        );
      case AppThemeMode.cream:
        return _buildTheme(
          brightness: Brightness.light,
          bg: const Color(0xFFFAF6F0),
          fg: const Color(0xFF2D2418),
          cardBg: const Color(0xFFF5EDE2),
          primary: const Color(0xFFE67E22),
          secondary: const Color(0xFFF8F2EA),
          accent: const Color(0xFFD4A76A),
        );
      case AppThemeMode.sunset:
        return _buildTheme(
          brightness: Brightness.light,
          bg: const Color(0xFFFFF3E0),
          fg: const Color(0xFF1B3A4B),
          cardBg: const Color(0xFFFFF8EE),
          primary: const Color(0xFFE65100),
          secondary: const Color(0xFFFFE0B2),
          accent: const Color(0xFFFF8F00),
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
    final textTheme = GoogleFonts.interTextTheme(
      ThemeData(brightness: brightness).textTheme,
    );

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
        tertiary: accent,
        error: const Color(0xFFEF5350),
        onError: Colors.white,
        surface: cardBg,
        onSurface: fg,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
        iconTheme: IconThemeData(color: fg.withValues(alpha: 0.8)),
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: fg.withValues(alpha: isDark ? 0.08 : 0.06),
          ),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark
            ? fg.withValues(alpha: 0.05)
            : fg.withValues(alpha: 0.03),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: fg.withValues(alpha: 0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: fg.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
        labelStyle: TextStyle(
          color: fg.withValues(alpha: 0.6),
          fontWeight: FontWeight.w500,
        ),
        hintStyle: TextStyle(color: fg.withValues(alpha: 0.35)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: isDark ? Colors.black : Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 14,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: BorderSide(color: primary.withValues(alpha: 0.4)),
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 14,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: fg.withValues(alpha: 0.08),
        thickness: 1,
        space: 1,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: cardBg,
        selectedItemColor: primary,
        unselectedItemColor: fg.withValues(alpha: 0.4),
        elevation: 0,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
        unselectedLabelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w500,
          fontSize: 12,
        ),
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: primary,
        unselectedLabelColor: fg.withValues(alpha: 0.5),
        indicatorColor: primary,
        labelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        unselectedLabelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
      ),
      textTheme: textTheme.copyWith(
        headlineLarge: textTheme.headlineLarge?.copyWith(
          color: fg,
          fontWeight: FontWeight.w800,
        ),
        titleLarge: textTheme.titleLarge?.copyWith(
          color: fg,
          fontWeight: FontWeight.w700,
        ),
        titleMedium: textTheme.titleMedium?.copyWith(
          color: fg,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: textTheme.bodyLarge?.copyWith(
          color: fg,
          fontSize: 16,
          height: 1.6,
        ),
        bodyMedium: textTheme.bodyMedium?.copyWith(
          color: fg.withValues(alpha: 0.8),
          fontSize: 14,
          height: 1.5,
        ),
        bodySmall: textTheme.bodySmall?.copyWith(
          color: fg.withValues(alpha: 0.55),
          fontSize: 12,
        ),
        labelSmall: textTheme.labelSmall?.copyWith(
          color: fg.withValues(alpha: 0.5),
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
