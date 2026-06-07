class TextUtils {
  static const Set<String> _abbreviations = {
    'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'vs.', 'etc.', 'fig.',
    'al.', 'gen.', 'rep.', 'sen.', 'gov.', 'est.', 'no.', 'op.', 'vol.', 'pp.'
  };

  static List<int> getParagraphRange(int index, List<String> tokens) {
    bool isParagraphBreak(String token) {
      final newlineCount = '\n'.allMatches(token).length;
      return newlineCount >= 2;
    }

    int start = index;
    for (int i = index - 1; i >= 0; i--) {
      if (isParagraphBreak(tokens[i])) {
        start = i + 1;
        break;
      }
      if (i == 0) start = 0;
    }

    int end = index;
    for (int i = index + 1; i < tokens.length; i++) {
      if (isParagraphBreak(tokens[i])) {
        end = i - 1;
        break;
      }
      if (i == tokens.length - 1) end = i;
    }

    while (start <= end && tokens[start].trim().isEmpty) {
      start++;
    }
    while (end >= start && tokens[end].trim().isEmpty) {
      end--;
    }

    final List<int> range = [];
    for (int k = start; k <= end; k++) {
      range.add(k);
    }
    return range;
  }

  static List<int> getSentenceRange(int index, List<String> tokens) {
    bool isSentenceEnd(String token) {
      final t = token.trim();
      if (t.isEmpty) return false;

      // Match . ! ? optionally followed by quotes/brackets
      final hasPunctuation = RegExp(r"[.!?]['" + '"' + r"”’)]*$").hasMatch(t);
      if (!hasPunctuation) return false;

      final lowerToken = t.toLowerCase();
      final cleaned = lowerToken.replaceAll(RegExp(r"['" + '"' + r"”’)]+$"), '');

      if (_abbreviations.contains(cleaned)) {
        return false;
      }
      return true;
    }

    int start = index;
    int i = index - 1;
    while (i >= 0) {
      final token = tokens[i];
      if (token.contains('\n')) {
        start = i + 1;
        break;
      }
      if (token.trim().isNotEmpty) {
        if (isSentenceEnd(token)) {
          start = i + 1;
          break;
        }
      }
      if (i == 0) {
        start = 0;
      }
      i--;
    }

    int end = index;
    i = index;
    while (i < tokens.length) {
      final token = tokens[i];
      if (token.contains('\n')) {
        end = i - 1 < index ? index : i - 1;
        break;
      }
      if (token.trim().isNotEmpty) {
        if (isSentenceEnd(token)) {
          end = i;
          break;
        }
      }
      if (i == tokens.length - 1) {
        end = i;
      }
      i++;
    }

    while (start <= end && tokens[start].trim().isEmpty) {
      start++;
    }
    while (end >= start && tokens[end].trim().isEmpty) {
      end--;
    }

    final List<int> range = [];
    for (int k = start; k <= end; k++) {
      range.add(k);
    }
    return range;
  }

  static String cleanResponse(String text, {bool multiline = false}) {
    if (text.isEmpty) return '';

    // Remove <think>...</think> tags
    String cleaned = text.replaceAll(RegExp(r'<think>[\s\S]*?</think>', caseSensitive: false), '').trim();

    // Remove markdown code blocks if present
    if (cleaned.contains('```')) {
      final match = RegExp(r'```(?:json)?\s*([\s\S]*?)\s*```', caseSensitive: false).firstMatch(cleaned);
      if (match != null) {
        cleaned = match.group(1)!.trim();
      }
    }

    // Remove quotes if the WHOLE response is quoted
    if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length > 2) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }

    // Remove common prefixes
    final prefixes = [
      'Translation:',
      'The translation is:',
      'Here is the translation:',
      'Result:',
      'Answer:',
      'Translated text:',
    ];
    for (final prefix in prefixes) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.substring(prefix.length).trim();
      }
    }

    // Strip markdown formatting symbols from translation text if it's a simple response
    if (!multiline) {
      cleaned = cleaned.split('\n')[0].trim();
      // Strip markdown header symbols (###, ##, #), bold/italic markers (**, *, _), horizontal lines (---, ***)
      cleaned = cleaned.replaceAll(RegExp(r'^(?:#+\s*|\*+\s*|-\s*)'), '');
      cleaned = cleaned.replaceAll(RegExp(r'[*_`~]'), '');
    }

    return cleaned.trim();
  }
}
