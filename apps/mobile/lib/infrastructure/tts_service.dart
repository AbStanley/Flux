import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  final FlutterTts _flutterTts = FlutterTts();
  bool _isPlaying = false;
  bool _isPaused = false;

  bool get isPlaying => _isPlaying;
  bool get isPaused => _isPaused;

  TtsService() {
    _initTts();
  }

  void _initTts() {
    _flutterTts.setStartHandler(() {
      _isPlaying = true;
      _isPaused = false;
    });

    _flutterTts.setCompletionHandler(() {
      _isPlaying = false;
      _isPaused = false;
    });

    _flutterTts.setCancelHandler(() {
      _isPlaying = false;
      _isPaused = false;
    });

    _flutterTts.setErrorHandler((msg) {
      _isPlaying = false;
      _isPaused = false;
    });
  }

  Future<void> setLanguage(String langCode) async {
    await _flutterTts.setLanguage(langCode);
  }

  Future<void> setSpeechRate(double rate) async {
    // Flutter TTS speed ranges from 0.0 to 1.0 (0.5 is default speed)
    // Map web speech rates (0.5 to 2.0) to Flutter TTS rates
    double mappedRate = 0.5;
    if (rate <= 1.0) {
      mappedRate = 0.5 * rate; // 0.5 -> 0.25, 1.0 -> 0.5
    } else {
      mappedRate = 0.5 + (rate - 1.0) * 0.33; // 1.5 -> 0.665, 2.0 -> 0.83
    }
    mappedRate = mappedRate.clamp(0.0, 1.0);
    await _flutterTts.setSpeechRate(mappedRate);
  }

  Future<void> speak(
    String text, {
    required Function(int startCharIndex, int endCharIndex) onProgress,
    required Function() onComplete,
  }) async {
    _flutterTts.setProgressHandler((String text, int start, int end, String word) {
      onProgress(start, end);
    });

    _flutterTts.setCompletionHandler(() {
      _isPlaying = false;
      _isPaused = false;
      onComplete();
    });

    await _flutterTts.speak(text);
  }

  Future<void> stop() async {
    await _flutterTts.stop();
    _isPlaying = false;
    _isPaused = false;
  }

  Future<void> pause() async {
    await _flutterTts.stop(); // Android doesn't support pause in flutter_tts, so we stop instead
    _isPlaying = false;
    _isPaused = true;
  }

  Future<List<String>> getAvailableLanguages() async {
    final List<dynamic>? languages = await _flutterTts.getLanguages;
    if (languages == null) return [];
    return languages.map((l) => l.toString()).toList();
  }
}

final ttsService = TtsService();
