import '../../domain/models.dart';
import '../../infrastructure/api_client.dart';
import 'reader_provider.dart';

class ReaderAiController {
  final ReaderProvider _provider;

  RichTranslation? _activeTranslation;
  bool _isLoadingTranslation = false;
  String? _translationError;
  bool _isGenerating = false;
  String? _generationError;

  ReaderAiController(this._provider);

  RichTranslation? get activeTranslation => _activeTranslation;
  bool get isLoadingTranslation => _isLoadingTranslation;
  String? get translationError => _translationError;
  bool get isGenerating => _isGenerating;
  String? get generationError => _generationError;

  void clearTranslation() {
    _activeTranslation = null;
    _translationError = null;
    _provider.notify();
  }

  Future<void> fetchTranslationForSelection(String selectedText, String model) async {
    final query = selectedText.trim();
    if (query.isEmpty) return;

    _isLoadingTranslation = true;
    _translationError = null;
    _activeTranslation = null;
    _provider.notify();

    try {
      final data = await apiClient.post<Map<String, dynamic>>('/api/rich-translation', {
        'text': query,
        'targetLanguage': 'en',
        'context': _provider.text,
        'model': model,
      });
      _activeTranslation = RichTranslation.fromJson(data);
    } catch (e) {
      _translationError = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoadingTranslation = false;
      _provider.notify();
    }
  }

  Future<void> generateStory({
    required String topic,
    required String level,
    required String sourceLang,
    required String contentType,
    required String model,
  }) async {
    _isGenerating = true;
    _generationError = null;
    _provider.clearText();
    _provider.notify();

    try {
      final buffer = StringBuffer();
      await apiClient.stream(
        '/api/generate-content',
        {
          'topic': topic,
          'sourceLanguage': sourceLang,
          'isLearningMode': false,
          'proficiencyLevel': level,
          'contentType': contentType,
          'model': model,
          'stream': true,
        },
        (chunk) {
          if (chunk.containsKey('response')) {
            final resp = chunk['response'] as String;
            buffer.write(resp);
            _provider.updateGeneratedText(buffer.toString());
          }
        },
      );
      _provider.updateGeneratedText(buffer.toString(), force: true);
    } catch (e) {
      _generationError = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isGenerating = false;
      _provider.notify();
    }
  }

  Future<String> translateWord(String word, String targetLanguage, String model) async {
    try {
      final data = await apiClient.post<Map<String, dynamic>>('/api/translate', {
        'text': word,
        'targetLanguage': targetLanguage,
        'context': _provider.text,
        if (model.isNotEmpty) 'model': model,
      });
      return (data['response'] ?? '') as String;
    } catch (e) {
      return 'Error: ${e.toString().replaceFirst('Exception: ', '')}';
    }
  }
}
