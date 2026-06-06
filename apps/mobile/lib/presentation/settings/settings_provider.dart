import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../domain/llm_types.dart';
import '../../infrastructure/api_client.dart';
import '../../infrastructure/llm/llm_service.dart';
import '../../infrastructure/llm/local_model_manager.dart';

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

  // Local model state
  LlmMode _llmMode = LlmMode.server;
  String _selectedLocalModel = 'gemma-4-e2b';
  List<LocalModelInfo> _localModels = [];
  bool _isLoadingModel = false;
  String? _loadedModelId;

  AppThemeMode get themeMode => _themeMode;
  String get apiUrl => _apiUrl;
  String get sourceLanguage => _sourceLanguage;
  String get sourceLangCode => _sourceLangCode;
  String get targetLanguage => _targetLanguage;
  String get targetLangCode => _targetLangCode;
  String get proficiencyLevel => _proficiencyLevel;
  String get selectedModel => _selectedModel;
  List<String> get availableModels => _availableModels;
  LlmMode get llmMode => _llmMode;
  String get selectedLocalModel => _selectedLocalModel;
  List<LocalModelInfo> get localModels => _localModels;
  bool get isLoadingModel => _isLoadingModel;

  /// Whether the user is currently using on-device inference.
  bool get isLocalMode => _llmMode == LlmMode.local;

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

    // Restore LLM mode preference
    final modeStr = prefs.getString(AppConstants.keyLlmMode) ?? 'server';
    _llmMode = modeStr == 'local' ? LlmMode.local : LlmMode.server;
    llmService.setMode(_llmMode);

    _selectedLocalModel = prefs.getString(AppConstants.keySelectedLocalModel) ?? 'gemma-4-e2b';

    notifyListeners();
    fetchAvailableModels();
    await refreshLocalModels();
  }

  Future<void> updateLlmMode(LlmMode mode) async {
    _llmMode = mode;
    llmService.setMode(mode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyLlmMode, mode.name);
    await _syncModelLoading();
    notifyListeners();
  }

  Future<void> updateSelectedLocalModel(String modelId) async {
    _selectedLocalModel = modelId;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keySelectedLocalModel, modelId);
    await _syncModelLoading();
    notifyListeners();
  }

  /// Refresh the local model catalog from the native side.
  Future<void> refreshLocalModels() async {
    _localModels = await localModelManager.listAvailableModels();
    final downloaded = await localModelManager.listDownloadedModels();
    final downloadedIds = downloaded.map((m) => m.id).toSet();
    for (final model in _localModels) {
      model.isDownloaded = downloadedIds.contains(model.id);
    }
    await _syncModelLoading();
    notifyListeners();
  }

  Future<void> _syncModelLoading() async {
    if (_llmMode == LlmMode.local) {
      final isDownloaded = _localModels.any((m) => m.id == _selectedLocalModel && m.isDownloaded);
      if (isDownloaded) {
        if (_loadedModelId != _selectedLocalModel) {
          _isLoadingModel = true;
          notifyListeners();
          try {
            await localModelManager.loadModel(_selectedLocalModel);
            _loadedModelId = _selectedLocalModel;
          } catch (e) {
            debugPrint("Model load failed: $e");
            _loadedModelId = null;
          } finally {
            _isLoadingModel = false;
            notifyListeners();
          }
        }
      } else {
        await localModelManager.unloadModel();
        _loadedModelId = null;
      }
    } else if (_loadedModelId != null) {
      await localModelManager.unloadModel();
      _loadedModelId = null;
    }
  }

  Future<void> updateApiUrl(String url) async {
    _apiUrl = url;
    await apiClient.updateBaseUrl(url);
    notifyListeners();
    fetchAvailableModels();
  }

  Future<void> updateTheme(AppThemeMode mode) async {
    _themeMode = mode;
    await (await SharedPreferences.getInstance()).setString(AppConstants.keySelectedTheme, mode.name);
    notifyListeners();
  }

  Future<void> updateLanguages({
    required String source, required String sourceCode,
    required String target, required String targetCode,
  }) async {
    _sourceLanguage = source; _sourceLangCode = sourceCode;
    _targetLanguage = target; _targetLangCode = targetCode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keySourceLang, source);
    await prefs.setString(AppConstants.keySourceLangCode, sourceCode);
    await prefs.setString(AppConstants.keyTargetLang, target);
    await prefs.setString(AppConstants.keyTargetLangCode, targetCode);
    notifyListeners();
  }

  Future<void> updateProficiencyLevel(String level) async {
    _proficiencyLevel = level;
    await (await SharedPreferences.getInstance()).setString(AppConstants.keyProficiencyLevel, level);
    notifyListeners();
  }

  Future<void> updateSelectedModel(String model) async {
    _selectedModel = model;
    await (await SharedPreferences.getInstance()).setString(AppConstants.keySelectedModel, model);
    notifyListeners();
  }

  Future<void> fetchAvailableModels() async {
    try {
      final data = await apiClient.get<Map<String, dynamic>>('/api/tags');
      if (data.containsKey('models')) {
        final List list = data['models'];
        _availableModels = list.map((m) => m['name'] as String).toList();
        if (_availableModels.isNotEmpty && !_availableModels.contains(_selectedModel)) {
          _selectedModel = _availableModels.first;
        }
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<bool> testConnection() async {
    try {
      final data = await apiClient.get<Map<String, dynamic>>('/api/tags').timeout(const Duration(seconds: 5));
      return data.containsKey('models');
    } catch (_) {
      return false;
    }
  }
}
