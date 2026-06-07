import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../domain/models.dart';

class GrammarTab extends StatelessWidget {
  final RichTranslation translation;
  const GrammarTab({super.key, required this.translation});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        if (translation.grammar != null) ...[
          _buildChip(cs, translation.grammar!.partOfSpeech),
          const SizedBox(height: 12),
          if (translation.grammar!.infinitive != null)
            _buildInfoRow(cs, 'Infinitive', translation.grammar!.infinitive!),
          if (translation.grammar!.tense != null)
            _buildInfoRow(cs, 'Tense', translation.grammar!.tense!),
          const SizedBox(height: 12),
          MarkdownBody(
            data: translation.grammar!.explanation,
            styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
              p: TextStyle(
                fontSize: 14,
                height: 1.6,
                color: cs.onSurface.withValues(alpha: 0.8),
              ),
              strong: TextStyle(
                fontWeight: FontWeight.bold,
                color: cs.primary,
              ),
            ),
          ),
        ] else
          Text(
            'No grammatical breakdown available.',
            style: TextStyle(
              fontStyle: FontStyle.italic,
              color: cs.onSurface.withValues(alpha: 0.5),
            ),
          ),
        if (translation.conjugations != null &&
            translation.conjugations!.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            'Conjugations',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          ...translation.conjugations!.entries.map((entry) {
            return ExpansionTile(
              title: Text(entry.key),
              childrenPadding: const EdgeInsets.only(bottom: 8),
              children: entry.value.map((row) {
                return ListTile(
                  dense: true,
                  title: Text(row.pronoun),
                  trailing: Text(
                    row.conjugation,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: cs.primary,
                    ),
                  ),
                );
              }).toList(),
            );
          }),
        ],
      ],
    );
  }

  Widget _buildChip(ColorScheme cs, String label) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: cs.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label.toUpperCase(),
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 12,
            color: cs.primary,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(ColorScheme cs, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: cs.onSurface.withValues(alpha: 0.6),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: cs.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}
