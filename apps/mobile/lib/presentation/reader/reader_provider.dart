import 'package:flutter/material.dart';
import '../../core/text_utils.dart';
import '../../domain/models.dart';
import 'reader_ai_controller.dart';
import 'reader_tts_controller.dart';

enum SelectionMode { word, sentence, paragraph }

class ReaderProvider extends ChangeNotifier {
  String _text = '';
  List<String> _tokens = [];
  final List<int> _tokenOffsets = [];
  final Set<int> _selectedIndices = {};
  int _currentPage = 1;
  final int _pageSize = 300;

  SelectionMode _selectionMode = SelectionMode.word;
  String _readingMode = 'STANDARD';
  bool _isZenMode = false;
  DateTime _lastNotifyTime = DateTime.fromMillisecondsSinceEpoch(0);

  late final ReaderTtsController tts;
  late final ReaderAiController ai;

  ReaderProvider() {
    tts = ReaderTtsController(this);
    ai = ReaderAiController(this);
  }

  String get text => _text;
  List<String> get tokens => _tokens;
  List<int> get tokenOffsets => _tokenOffsets;
  Set<int> get selectedIndices => _selectedIndices;
  int get currentPage => _currentPage;
  int get pageSize => _pageSize;
  SelectionMode get selectionMode => _selectionMode;
  String get readingMode => _readingMode;
  bool get isZenMode => _isZenMode;

  bool get isGenerating => ai.isGenerating;
  String? get generationError => ai.generationError;
  RichTranslation? get activeTranslation => ai.activeTranslation;
  bool get isLoadingTranslation => ai.isLoadingTranslation;
  String? get translationError => ai.translationError;

  bool get isPlayingAudio => tts.isPlaying;
  int? get currentAudioTokenIndex => tts.currentAudioTokenIndex;
  double get playbackRate => tts.playbackRate;

  int get totalPages => (_tokens.length / _pageSize).ceil();

  List<String> get currentPageTokens {
    if (_tokens.isEmpty) return [];
    final start = (_currentPage - 1) * _pageSize;
    final end = (start + _pageSize).clamp(0, _tokens.length);
    return _tokens.sublist(start, end);
  }

  void notify() => notifyListeners();

  void loadText(String text) {
    _text = text;
    _tokens = text.split(RegExp(r'(\s+)'));
    _currentPage = 1;
    _selectedIndices.clear();
    _tokenOffsets.clear();
    int currentLen = 0;
    for (final token in _tokens) {
      _tokenOffsets.add(currentLen);
      currentLen += token.length;
    }
    tts.stop();
    ai.clearTranslation();
    notifyListeners();
  }

  void clearText() {
    _text = '';
    _tokens.clear();
    _tokenOffsets.clear();
    _selectedIndices.clear();
    _currentPage = 1;
  }

  void updateGeneratedText(String text, {bool force = false}) {
    _text = text;
    _tokens = text.split(RegExp(r'(\s+)'));
    _tokenOffsets.clear();
    int currentLen = 0;
    for (final token in _tokens) {
      _tokenOffsets.add(currentLen);
      currentLen += token.length;
    }
    final now = DateTime.now();
    if (force || now.difference(_lastNotifyTime).inMilliseconds > 150) {
      _lastNotifyTime = now;
      notifyListeners();
    }
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

  void handleSelection(int pageIndex, String model) {
    final globalIndex = (_currentPage - 1) * _pageSize + pageIndex;
    if (globalIndex < 0 || globalIndex >= _tokens.length) return;

    if (_selectedIndices.contains(globalIndex)) {
      clearSelection();
    } else {
      _selectedIndices.clear(); // Always clear previous selection on mobile so they don't accumulate
      if (_selectionMode == SelectionMode.word) {
        _selectedIndices.add(globalIndex);
      } else if (_selectionMode == SelectionMode.sentence) {
        _selectedIndices.addAll(TextUtils.getSentenceRange(globalIndex, _tokens));
      } else if (_selectionMode == SelectionMode.paragraph) {
        _selectedIndices.addAll(TextUtils.getParagraphRange(globalIndex, _tokens));
      }
      notifyListeners();
      fetchRichTranslation(model);
    }
  }

  Future<void> fetchRichTranslation(String model) async {
    final query = selectedText.trim();
    if (query.isEmpty) return;
    await ai.fetchTranslationForSelection(query, model);
  }

  void clearSelection() {
    _selectedIndices.clear();
    ai.clearTranslation();
    notifyListeners();
  }

  String get selectedText {
    if (_selectedIndices.isEmpty) return '';
    final sorted = _selectedIndices.toList()..sort();
    return sorted.map((idx) => _tokens[idx]).join('');
  }

  Future<void> generateStory({
    required String topic,
    required String level,
    required String sourceLang,
    required String contentType,
    required String model,
  }) async {
    await ai.generateStory(
      topic: topic,
      level: level,
      sourceLang: sourceLang,
      contentType: contentType,
      model: model,
    );
  }

  Future<void> cancelGeneration() async {
    await ai.cancelGeneration();
  }

  Future<void> setPlaybackRate(double rate) => tts.setPlaybackRate(rate);
  Future<void> playAudio() => tts.play();
  Future<void> pauseAudio() => tts.pause();
  Future<void> stopAudio() => tts.stop();

  Future<String> translateTextSimple(String word, String targetLanguage, String model) =>
      ai.translateWord(word, targetLanguage, model);

  Future<void> speakSingleWord(String word) => tts.speakWord(word);
}
