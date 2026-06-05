import 'package:flutter/material.dart';
import '../../core/text_utils.dart';
import '../../domain/models.dart';
import '../../infrastructure/api_client.dart';
import '../../infrastructure/tts_service.dart';

enum SelectionMode { word, sentence, paragraph }

class ReaderProvider extends ChangeNotifier {
  String _text = '';
  List<String> _tokens = [];
  List<int> _tokenOffsets = [];
  final Set<int> _selectedIndices = {};
  int _currentPage = 1;
  int _pageSize = 300; // Mobile-friendly page size

  SelectionMode _selectionMode = SelectionMode.word;
  String _readingMode = 'STANDARD'; // 'STANDARD' or 'GRAMMAR'
  bool _isZenMode = false;

  // Audio State
  bool _isPlayingAudio = false;
  int? _currentAudioTokenIndex;
  double _playbackRate = 1.0;

  // Translation State
  RichTranslation? _activeTranslation;
  bool _isLoadingTranslation = false;
  String? _translationError;

  // Getters
  String get text => _text;
  List<String> get tokens => _tokens;
  Set<int> get selectedIndices => _selectedIndices;
  int get currentPage => _currentPage;
  int get pageSize => _pageSize;
  SelectionMode get selectionMode => _selectionMode;
  String get readingMode => _readingMode;
  bool get isZenMode => _isZenMode;
  bool get isPlayingAudio => _isPlayingAudio;
  int? get currentAudioTokenIndex => _currentAudioTokenIndex;
  double get playbackRate => _playbackRate;
  RichTranslation? get activeTranslation => _activeTranslation;
  bool get isLoadingTranslation => _isLoadingTranslation;
  String? get translationError => _translationError;

  int get totalPages => (_tokens.length / _pageSize).ceil();

  List<String> get currentPageTokens {
    if (_tokens.isEmpty) return [];
    final start = (_currentPage - 1) * _pageSize;
    final end = (start + _pageSize).clamp(0, _tokens.length);
    return _tokens.sublist(start, end);
  }

  void loadText(String text) {
    _text = text;
    _tokens = text.split(RegExp(r'(\s+)'));
    _currentPage = 1;
    _selectedIndices.clear();

    // Precalculate offsets for TTS boundary sync
    _tokenOffsets.clear();
    int currentLen = 0;
    for (final token in _tokens) {
      _tokenOffsets.add(currentLen);
      currentLen += token.length;
    }

    stopAudio();
    _activeTranslation = null;
    notifyListeners();
  }

  void setCurrentPage(int page) {
    if (page < 1 || page > totalPages) return;
    _currentPage = page;
    _selectedIndices.clear();
    notifyListeners();
  }

  void setSelectionMode(SelectionMode mode) {
    _selectionMode = mode;
    _selectedIndices.clear();
    notifyListeners();
  }

  void setReadingMode(String mode) {
    _readingMode = mode;
    notifyListeners();
  }

  void toggleZenMode() {
    _isZenMode = !_isZenMode;
    notifyListeners();
  }

  void handleSelection(int pageIndex) {
    final globalIndex = (_currentPage - 1) * _pageSize + pageIndex;
    if (globalIndex < 0 || globalIndex >= _tokens.length) return;

    if (_selectedIndices.contains(globalIndex)) {
      _selectedIndices.remove(globalIndex);
    } else {
      if (_selectionMode == SelectionMode.word) {
        _selectedIndices.add(globalIndex);
      } else if (_selectionMode == SelectionMode.sentence) {
        _selectedIndices.clear();
        _selectedIndices.addAll(TextUtils.getSentenceRange(globalIndex, _tokens));
      } else if (_selectionMode == SelectionMode.paragraph) {
        _selectedIndices.clear();
        _selectedIndices.addAll(TextUtils.getParagraphRange(globalIndex, _tokens));
      }
    }
    notifyListeners();

    if (_selectedIndices.isNotEmpty) {
      fetchTranslationForSelection();
    } else {
      _activeTranslation = null;
      notifyListeners();
    }
  }

  void clearSelection() {
    _selectedIndices.clear();
    _activeTranslation = null;
    notifyListeners();
  }

  String get selectedText {
    if (_selectedIndices.isEmpty) return '';
    final sorted = _selectedIndices.toList()..sort();
    return sorted.map((idx) => _tokens[idx]).join('');
  }

  Future<void> fetchTranslationForSelection() async {
    final query = selectedText.trim();
    if (query.isEmpty) return;

    _isLoadingTranslation = true;
    _translationError = null;
    _activeTranslation = null;
    notifyListeners();

    try {
      final data = await apiClient.post<Map<String, dynamic>>('/api/rich-translation', {
        'text': query,
        'targetLanguage': 'en',
        'context': _text,
      });
      _activeTranslation = RichTranslation.fromJson(data);
    } catch (e) {
      _translationError = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoadingTranslation = false;
      notifyListeners();
    }
  }

  Future<void> setPlaybackRate(double rate) async {
    _playbackRate = rate;
    await ttsService.setSpeechRate(rate);
    notifyListeners();
  }

  Future<void> playAudio() async {
    if (_tokens.isEmpty) return;
    int startTokenIndex = (_currentPage - 1) * _pageSize;

    // Check if we already have a progress, play from there
    if (_currentAudioTokenIndex != null &&
        _currentAudioTokenIndex! >= startTokenIndex &&
        _currentAudioTokenIndex! < startTokenIndex + _pageSize) {
      startTokenIndex = _currentAudioTokenIndex!;
    }

    final String textToPlay = _tokens.sublist(startTokenIndex).join('');
    final int baseOffset = _tokenOffsets[startTokenIndex];

    _isPlayingAudio = true;
    notifyListeners();

    await ttsService.speak(
      textToPlay,
      onProgress: (startChar, endChar) {
        final absoluteChar = baseOffset + startChar;
        // Map back to token
        int foundTokenIdx = startTokenIndex;
        for (int i = _tokenOffsets.length - 1; i >= startTokenIndex; i--) {
          if (_tokenOffsets[i] <= absoluteChar) {
            foundTokenIdx = i;
            break;
          }
        }
        _currentAudioTokenIndex = foundTokenIdx;
        notifyListeners();
      },
      onComplete: () {
        _isPlayingAudio = false;
        _currentAudioTokenIndex = null;
        notifyListeners();
      },
    );
  }

  Future<void> pauseAudio() async {
    await ttsService.pause();
    _isPlayingAudio = false;
    notifyListeners();
  }

  Future<void> stopAudio() async {
    await ttsService.stop();
    _isPlayingAudio = false;
    _currentAudioTokenIndex = null;
    notifyListeners();
  }
}
