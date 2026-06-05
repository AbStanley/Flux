class ExampleSentence {
  final int? id;
  final String sentence;
  final String translation;

  ExampleSentence({this.id, required this.sentence, required this.translation});

  factory ExampleSentence.fromJson(Map<String, dynamic> json) {
    return ExampleSentence(
      id: json['id'] as int?,
      sentence: (json['sentence'] ?? json['text'] ?? '') as String,
      translation: (json['translation'] ?? '') as String,
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'sentence': sentence,
        'translation': translation,
      };
}

class ConjugationRow {
  final String pronoun;
  final String conjugation;

  ConjugationRow({required this.pronoun, required this.conjugation});

  factory ConjugationRow.fromJson(Map<String, dynamic> json) {
    return ConjugationRow(
      pronoun: (json['pronoun'] ?? '') as String,
      conjugation: (json['conjugation'] ?? '') as String,
    );
  }
}

class GrammarInfo {
  final String partOfSpeech;
  final String? tense;
  final String? gender;
  final String? number;
  final String? infinitive;
  final String explanation;

  GrammarInfo({
    required this.partOfSpeech,
    this.tense,
    this.gender,
    this.number,
    this.infinitive,
    required this.explanation,
  });

  factory GrammarInfo.fromJson(Map<String, dynamic> json) {
    return GrammarInfo(
      partOfSpeech: (json['partOfSpeech'] ?? '') as String,
      tense: json['tense'] as String?,
      gender: json['gender'] as String?,
      number: json['number'] as String?,
      infinitive: json['infinitive'] as String?,
      explanation: (json['explanation'] ?? '') as String,
    );
  }
}

class RichTranslation {
  final String? type;
  final bool isVerb;
  final String translation;
  final String? translationConjugated;
  final String segment;
  final GrammarInfo? grammar;
  final String? syntaxAnalysis;
  final List<String>? grammarRules;
  final List<ExampleSentence> examples;
  final List<String> alternatives;
  final Map<String, List<ConjugationRow>>? conjugations;

  RichTranslation({
    this.type,
    this.isVerb = false,
    required this.translation,
    this.translationConjugated,
    required this.segment,
    this.grammar,
    this.syntaxAnalysis,
    this.grammarRules,
    required this.examples,
    required this.alternatives,
    this.conjugations,
  });

  factory RichTranslation.fromJson(Map<String, dynamic> json) {
    final List rawExamples = json['examples'] ?? [];
    final List rawAlts = json['alternatives'] ?? [];

    Map<String, List<ConjugationRow>>? parsedConjugations;
    if (json['conjugations'] != null && json['conjugations'] is Map) {
      parsedConjugations = {};
      (json['conjugations'] as Map).forEach((key, val) {
        if (val is List) {
          parsedConjugations![key.toString()] =
              val.map((item) => ConjugationRow.fromJson(item)).toList();
        }
      });
    }

    return RichTranslation(
      type: json['type'] as String?,
      isVerb: (json['isVerb'] ?? false) as bool,
      translation: (json['translation'] ?? '') as String,
      translationConjugated: json['translationConjugated'] as String?,
      segment: (json['segment'] ?? '') as String,
      grammar: json['grammar'] != null
          ? GrammarInfo.fromJson(json['grammar'])
          : null,
      syntaxAnalysis: json['syntaxAnalysis'] as String?,
      grammarRules: json['grammarRules'] != null
          ? List<String>.from(json['grammarRules'])
          : null,
      examples: rawExamples.map((x) => ExampleSentence.fromJson(x)).toList(),
      alternatives: rawAlts.map((x) => x.toString()).toList(),
      conjugations: parsedConjugations,
    );
  }
}

class WordItem {
  final int id;
  final String text;
  final String definition;
  final String? explanation;
  final String? context;
  final String sourceLanguage;
  final String targetLanguage;
  final String? sourceTitle;
  final String? imageUrl;
  final String? pronunciation;
  final String type; // 'word' | 'phrase'
  final DateTime createdAt;
  final int? deckId;
  final List<ExampleSentence> examples;

  WordItem({
    required this.id,
    required this.text,
    required this.definition,
    this.explanation,
    this.context,
    required this.sourceLanguage,
    required this.targetLanguage,
    this.sourceTitle,
    this.imageUrl,
    this.pronunciation,
    required this.type,
    required this.createdAt,
    this.deckId,
    required this.examples,
  });

  factory WordItem.fromJson(Map<String, dynamic> json) {
    final List rawEx = json['examples'] ?? [];
    return WordItem(
      id: json['id'] as int,
      text: (json['text'] ?? '') as String,
      definition: (json['definition'] ?? '') as String,
      explanation: json['explanation'] as String?,
      context: json['context'] as String?,
      sourceLanguage: (json['sourceLanguage'] ?? '') as String,
      targetLanguage: (json['targetLanguage'] ?? '') as String,
      sourceTitle: json['sourceTitle'] as String?,
      imageUrl: json['imageUrl'] as String?,
      pronunciation: json['pronunciation'] as String?,
      type: (json['type'] ?? 'word') as String,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      deckId: json['deckId'] as int?,
      examples: rawEx.map((x) => ExampleSentence.fromJson(x)).toList(),
    );
  }
}

class DeckItem {
  final int id;
  final String name;
  final DateTime createdAt;

  DeckItem({required this.id, required this.name, required this.createdAt});

  factory DeckItem.fromJson(Map<String, dynamic> json) {
    return DeckItem(
      id: json['id'] as int,
      name: (json['name'] ?? '') as String,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}
