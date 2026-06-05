class WritingCorrection {
  final String type;
  final String shortDescription;
  final String longDescription;
  final int startIndex;
  final int endIndex;
  final String mistakeText;
  final String correctionText;

  WritingCorrection({
    required this.type,
    required this.shortDescription,
    required this.longDescription,
    required this.startIndex,
    required this.endIndex,
    required this.mistakeText,
    required this.correctionText,
  });

  factory WritingCorrection.fromJson(Map<String, dynamic> json) {
    final int offset = (json['offset'] ?? json['startIndex'] ?? 0) as int;
    final int length = (json['length'] ?? 0) as int;
    final mistake = (json['mistakeText'] ?? '') as String;
    final actualLength = length > 0 ? length : mistake.length;

    return WritingCorrection(
      type: (json['type'] ?? 'grammar') as String,
      shortDescription: (json['shortDescription'] ?? '') as String,
      longDescription: (json['longDescription'] ?? '') as String,
      startIndex: offset,
      endIndex: offset + actualLength,
      mistakeText: mistake,
      correctionText: (json['correctionText'] ?? '') as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'type': type,
        'shortDescription': shortDescription,
        'longDescription': longDescription,
        'startIndex': startIndex,
        'endIndex': endIndex,
        'mistakeText': mistakeText,
        'correctionText': correctionText,
      };
}
