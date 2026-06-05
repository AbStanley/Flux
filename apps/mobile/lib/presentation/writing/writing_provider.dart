import 'package:flutter/material.dart';
import '../../domain/writing_model.dart';
import '../../infrastructure/api_client.dart';

class WritingProvider extends ChangeNotifier {
  String _text = '';
  List<WritingCorrection> _corrections = [];
  bool _isAnalyzing = false;
  String? _error;

  String get text => _text;
  List<WritingCorrection> get corrections => _corrections;
  bool get isAnalyzing => _isAnalyzing;
  String? get error => _error;

  void setText(String value) {
    _text = value;
    // Do not notify listeners here to avoid breaking active cursor in text fields.
  }

  void clearAll() {
    _text = '';
    _corrections.clear();
    _error = null;
    notifyListeners();
  }

  Future<void> checkText({required String language, required String model}) async {
    if (_text.trim().isEmpty) {
      _corrections.clear();
      notifyListeners();
      return;
    }

    _isAnalyzing = true;
    _error = null;
    notifyListeners();

    try {
      final response = await apiClient.post<Map<String, dynamic>>('/api/check-writing', {
        'text': _text,
        'sourceLanguage': language,
        if (model.isNotEmpty) 'model': model,
      });

      final List rawCorr = response['corrections'] ?? [];
      _corrections = rawCorr
          .map((x) => WritingCorrection.fromJson(x as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isAnalyzing = false;
      notifyListeners();
    }
  }

  void acceptCorrection(WritingCorrection correction) {
    final offset = correction.startIndex;
    final length = correction.endIndex - correction.startIndex;

    // Verify the mistake still exists at this position
    if (offset + length > _text.length) return;
    final actualText = _text.substring(offset, offset + length);
    if (actualText != correction.mistakeText) {
      _corrections.remove(correction);
      notifyListeners();
      return;
    }

    // Replace text
    final newText = _text.substring(0, offset) +
        correction.correctionText +
        _text.substring(offset + length);

    // Calculate difference in lengths to adjust subsequent correction offsets
    final diff = correction.correctionText.length - length;

    final updatedCorrections = _corrections
        .where((c) => c != correction)
        .map((c) {
          if (c.startIndex > offset) {
            return WritingCorrection(
              type: c.type,
              shortDescription: c.shortDescription,
              longDescription: c.longDescription,
              startIndex: c.startIndex + diff,
              endIndex: c.endIndex + diff,
              mistakeText: c.mistakeText,
              correctionText: c.correctionText,
            );
          }
          return c;
        })
        .toList();

    _text = newText;
    _corrections = updatedCorrections;
    notifyListeners();
  }

  void dismissCorrection(WritingCorrection correction) {
    _corrections.remove(correction);
    notifyListeners();
  }
}
