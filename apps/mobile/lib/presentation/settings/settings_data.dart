import 'package:flutter/material.dart';
import '../../core/theme.dart';

/// Language entry: display name, ISO 639-1 code, flag emoji.
class LangEntry {
  final String name;
  final String code;
  final String flag;
  const LangEntry(this.name, this.code, this.flag);
}

const List<LangEntry> kLanguages = [
  LangEntry('English', 'en', '🇬🇧'),
  LangEntry('Spanish', 'es', '🇪🇸'),
  LangEntry('French', 'fr', '🇫🇷'),
  LangEntry('German', 'de', '🇩🇪'),
  LangEntry('Italian', 'it', '🇮🇹'),
  LangEntry('Portuguese', 'pt', '🇵🇹'),
  LangEntry('Russian', 'ru', '🇷🇺'),
  LangEntry('Ukrainian', 'uk', '🇺🇦'),
  LangEntry('Japanese', 'ja', '🇯🇵'),
  LangEntry('Chinese', 'zh', '🇨🇳'),
  LangEntry('Korean', 'ko', '🇰🇷'),
  LangEntry('Arabic', 'ar', '🇸🇦'),
  LangEntry('Dutch', 'nl', '🇳🇱'),
  LangEntry('Swedish', 'sv', '🇸🇪'),
  LangEntry('Polish', 'pl', '🇵🇱'),
  LangEntry('Turkish', 'tr', '🇹🇷'),
  LangEntry('Greek', 'el', '🇬🇷'),
  LangEntry('Hebrew', 'he', '🇮🇱'),
];

String codeFor(String langName) =>
    kLanguages.firstWhere((l) => l.name == langName).code;

/// Primary swatch colour per theme for the selector UI.
const Map<AppThemeMode, Color> kThemeSwatches = {
  AppThemeMode.light: Color(0xFF3D5AFE),
  AppThemeMode.dark: Color(0xFF7B8CFF),
  AppThemeMode.nordic: Color(0xFF5EC4E8),
  AppThemeMode.cream: Color(0xFFE67E22),
  AppThemeMode.sunset: Color(0xFFE65100),
};
