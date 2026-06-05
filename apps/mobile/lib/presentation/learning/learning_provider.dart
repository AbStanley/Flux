import 'package:flutter/material.dart';
import '../../infrastructure/api_client.dart';

class GameQuestion {
  final String question;
  final String answer;
  final List<String> choices;
  final String? context;

  GameQuestion({
    required this.question,
    required this.answer,
    required this.choices,
    this.context,
  });

  factory GameQuestion.fromJson(Map<String, dynamic> json) {
    // Backend may return target_text / source_translation or question / answer
    final qText = (json['question'] ?? json['target_text'] ?? '') as String;
    final aText = (json['answer'] ?? json['source_translation'] ?? '') as String;

    // Generate multiple choice options dynamically if none are provided
    List<String> options = [];
    if (json['choices'] != null) {
      options = List<String>.from(json['choices']);
    } else {
      // Fake options for testing
      options = [
        aText,
        '${aText}_alt1',
        '${aText}_alt2',
        '${aText}_alt3',
      ]..shuffle();
    }

    return GameQuestion(
      question: qText,
      answer: aText,
      choices: options,
      context: json['context'] as String?,
    );
  }
}

class LearningProvider extends ChangeNotifier {
  String? _activeGame;
  List<GameQuestion> _questions = [];
  int _currentIndex = 0;
  int _score = 0;
  int _health = 5;
  bool _isLoading = false;
  String? _error;

  String? get activeGame => _activeGame;
  List<GameQuestion> get questions => _questions;
  int get currentIndex => _currentIndex;
  int get score => _score;
  int get health => _health;
  bool get isLoading => _isLoading;
  String? get error => _error;

  GameQuestion? get currentQuestion {
    if (_questions.isEmpty || _currentIndex >= _questions.length) return null;
    return _questions[_currentIndex];
  }

  bool get isGameOver => _health <= 0 || (_questions.isNotEmpty && _currentIndex >= _questions.length);

  void resetGame() {
    _activeGame = null;
    _questions.clear();
    _currentIndex = 0;
    _score = 0;
    _health = 5;
    _error = null;
    notifyListeners();
  }

  Future<void> startGame({
    required String mode,
    required String topic,
    required String level,
    required String sourceLang,
    required String targetLang,
    required String model,
  }) async {
    _isLoading = true;
    _error = null;
    _activeGame = mode;
    notifyListeners();

    try {
      final data = await apiClient.post<List<dynamic>>('/api/generate-game-content', {
        'topic': topic.isEmpty ? 'General Vocabulary' : topic,
        'level': level,
        'mode': mode,
        'sourceLanguage': sourceLang,
        'targetLanguage': targetLang,
        'model': model,
      });

      _questions = data.map((x) => GameQuestion.fromJson(x as Map<String, dynamic>)).toList();
      _currentIndex = 0;
      _score = 0;
      _health = 5;

      if (_questions.isEmpty) {
        throw Exception('The AI failed to generate game questions. Please try again.');
      }

      // Populate choices from the batch of questions to create realistic multiple choice options
      for (final q in _questions) {
        // Collect other unique answers in the batch as distractors
        final distractors = _questions
            .map((item) => item.answer)
            .where((ans) => ans.trim().toLowerCase() != q.answer.trim().toLowerCase())
            .toSet()
            .toList();
        distractors.shuffle();
        final pickedDistractors = distractors.take(3).toList();
        
        // Fill up to 3 distractors if we have fewer questions in the batch
        while (pickedDistractors.length < 3) {
          pickedDistractors.add('${q.answer}_alt${pickedDistractors.length + 1}');
        }
        
        final allChoices = [q.answer, ...pickedDistractors]..shuffle();
        q.choices.clear();
        q.choices.addAll(allChoices);
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _activeGame = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void submitAnswer(String choice) {
    final question = currentQuestion;
    if (question == null) return;

    final isCorrect = choice.trim().toLowerCase() == question.answer.trim().toLowerCase();

    if (isCorrect) {
      _score += 10;
    } else {
      _health--;
    }

    _currentIndex++;
    notifyListeners();
  }
}
