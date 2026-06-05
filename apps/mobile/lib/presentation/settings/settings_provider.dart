import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../infrastructure/api_client.dart';

class SettingsProvider extends ChangeNotifier {
  AppThemeMode _themeMode = AppThemeMode.light;
  String _apiUrl = AppConstants.defaultApiUrl;
  String _sourceLanguage = AppConstants.defaultSourceLanguage;
  String _sourceLangCode = AppConstants.defaultSourceLangCode;
  String _targetLanguage = AppConstants.defaultTargetLanguage;
  String _targetLangCode = AppConstants.defaultTargetLangCode;
  String _proficiencyLevel = AppConstants.defaultProficiencyLevel;
  String _selectedModel = AppConstants.defaultLlmModel;
  List<String> _availableModels = [];

  AppThemeMode get themeMode => _themeMode;
  String get apiUrl => _apiUrl;
  String get sourceLanguage => _sourceLanguage;
  String get sourceLangCode => _sourceLangCode;
  String get targetLanguage => _targetLanguage;
  String get targetLangCode => _targetLangCode;
  String get proficiencyLevel => _proficiencyLevel;
  String get selectedModel => _selectedModel;
  List<String> get availableModels => _availableModels;

  SettingsProvider() {
    loadSettings();
  }

  Future<void> loadSettings() async {
    final prefs = await SharedPreferences.getInstance();

    _apiUrl = prefs.getString(AppConstants.keyApiUrl) ?? AppConstants.defaultApiUrl;
    await apiClient.updateBaseUrl(_apiUrl);

    final themeStr = prefs.getString(AppConstants.keySelectedTheme) ?? AppConstants.defaultTheme;
    _themeMode = AppThemeMode.values.firstWhere(
      (e) => e.name == themeStr,
      orElse: () => AppThemeMode.light,
    );

    _sourceLanguage = prefs.getString(AppConstants.keySourceLang) ?? AppConstants.defaultSourceLanguage;
    _sourceLangCode = prefs.getString(AppConstants.keySourceLangCode) ?? AppConstants.defaultSourceLangCode;
    _targetLanguage = prefs.getString(AppConstants.keyTargetLang) ?? AppConstants.defaultTargetLanguage;
    _targetLangCode = prefs.getString(AppConstants.keyTargetLangCode) ?? AppConstants.defaultTargetLangCode;
    _proficiencyLevel = prefs.getString(AppConstants.keyProficiencyLevel) ?? AppConstants.defaultProficiencyLevel;
    _selectedModel = prefs.getString(AppConstants.keySelectedModel) ?? AppConstants.defaultLlmModel;

    notifyListeners();
    fetchAvailableModels();
  }

  Future<void> updateApiUrl(String url) async {
    _apiUrl = url;
    await apiClient.updateBaseUrl(url);
    notifyListeners();
    fetchAvailableModels();
  }

  Future<void> updateTheme(AppThemeMode mode) async {
    _themeMode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keySelectedTheme, mode.name);
    notifyListeners();
  }

  Future<void> updateLanguages({
    required String source,
    required String sourceCode,
    required String target,
    required String targetCode,
  }) async {
    _sourceLanguage = source;
    _sourceLangCode = sourceCode;
    _targetLanguage = target;
    _targetLangCode = targetCode;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keySourceLang, source);
    await prefs.setString(AppConstants.keySourceLangCode, sourceCode);
    await prefs.setString(AppConstants.keyTargetLang, target);
    await prefs.setString(AppConstants.keyTargetLangCode, targetCode);
    notifyListeners();
  }

  Future<void> updateProficiencyLevel(String level) async {
    _proficiencyLevel = level;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyProficiencyLevel, level);
    notifyListeners();
  }

  Future<void> updateSelectedModel(String model) async {
    _selectedModel = model;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keySelectedModel, model);
    notifyListeners();
  }

  Future<void> fetchAvailableModels() async {
    try {
      final data = await apiClient.get<Map<String, dynamic>>('/api/tags');
      if (data.containsKey('models')) {
        final List modelsList = data['models'];
        _availableModels = modelsList.map((m) => m['name'] as String).toList();
        if (_availableModels.isNotEmpty && !_availableModels.contains(_selectedModel)) {
          _selectedModel = _availableModels.first;
        }
        notifyListeners();
      }
    } catch (_) {
      // Offline/server down, default models list unchanged
    }
  }

  Future<bool> testConnection() async {
    try {
      final data = await apiClient
          .get<Map<String, dynamic>>('/api/tags')
          .timeout(const Duration(seconds: 5));
      return data.containsKey('models');
    } catch (_) {
      return false;
    }
  }
}
