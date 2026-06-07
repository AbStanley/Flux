class LocalLlmPromptBuilder {
  static String buildPrompt(String endpoint, Map<String, dynamic> body) {
    if (endpoint.contains('generate-content')) {
      return _buildContentPrompt(body);
    }
    if (endpoint.contains('translate') ||
        endpoint.contains('rich-translation')) {
      return _buildTranslationPrompt(body);
    }
    if (endpoint.contains('check-writing')) {
      return _buildWritingCheckPrompt(body);
    }
    if (endpoint.contains('generate-game-content')) {
      return _buildGamePrompt(body);
    }
    return body['text'] as String? ?? body.toString();
  }

  static String _buildContentPrompt(Map<String, dynamic> b) {
    final topic = b['topic'] ?? 'general';
    final lang = b['sourceLanguage'] ?? 'English';
    final level = b['proficiencyLevel'] ?? 'B1';
    final type = b['contentType'] ?? 'story';
    return 'Write a $type in $lang about "$topic" for a $level level language learner. Keep it engaging and natural.';
  }

  static String _buildTranslationPrompt(Map<String, dynamic> b) {
    final text = b['text'] ?? '';
    final target = b['targetLanguage'] ?? 'English';
    final ctx = b['context'] ?? '';
    return 'Translate "$text" to $target. ${ctx.toString().isNotEmpty ? "Context: $ctx. " : ""}'
        'Return JSON: {"translation":"...","segment":"$text",'
        '"grammar":{"partOfSpeech":"...","explanation":"..."},'
        '"examples":[{"sentence":"...","translation":"..."}],'
        '"alternatives":["..."]}';
  }

  static String _buildWritingCheckPrompt(Map<String, dynamic> b) {
    final text = b['text'] ?? '';
    final lang = b['sourceLanguage'] ?? 'the target language';
    return 'Check this $lang text for errors: "$text". Return JSON: {"corrections":[{"type":"grammar",'
        '"shortDescription":"...","longDescription":"...","startIndex":0,"endIndex":5,"mistakeText":"...","correctionText":"..."}]}';
  }

  static String _buildGamePrompt(Map<String, dynamic> b) {
    final topic = b['topic'] ?? 'General Vocabulary';
    final level = b['level'] ?? 'B1';
    final src = b['sourceLanguage'] ?? 'English';
    final tgt = b['targetLanguage'] ?? 'Spanish';
    return 'Generate 8 vocabulary quiz questions about "$topic" from $src to $tgt at $level level. '
        'Return a JSON array: [{"question":"word in $tgt","answer":"translation in $src","choices":["opt1","opt2","opt3","opt4"]}]';
  }
}
