import 'package:flutter/material.dart';
import '../../domain/models.dart';
import '../../infrastructure/api_client.dart';

class WordsProvider extends ChangeNotifier {
  List<WordItem> _words = [];
  bool _isLoading = false;
  String? _error;
  int _totalWords = 0;

  List<WordItem> get words => _words;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalWords => _totalWords;

  Future<void> fetchWords({String? type}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final Map<String, String> params = {
        'limit': '100', // Load a healthy chunk for mobile scrolling
      };
      if (type != null) {
        params['type'] = type;
      }
      final data = await apiClient.get<Map<String, dynamic>>('/api/words', query: params);
      final List itemsList = data['items'] ?? [];
      _words = itemsList.map((x) => WordItem.fromJson(x)).toList();
      _totalWords = data['total'] ?? _words.length;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addWord(Map<String, dynamic> requestData) async {
    _isLoading = true;
    notifyListeners();
    try {
      final created = await apiClient.post<Map<String, dynamic>>('/api/words', requestData);
      _words.insert(0, WordItem.fromJson(created));
      _totalWords++;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteWord(int id) async {
    try {
      await apiClient.delete('/api/words/$id');
      _words.removeWhere((w) => w.id == id);
      _totalWords--;
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
    }
  }
}
