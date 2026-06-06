import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/models.dart';
import '../../infrastructure/tts_service.dart';
import 'reader_provider.dart';

class TranslationBottomSheet extends StatelessWidget {
  const TranslationBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = Provider.of<ReaderProvider>(context);
    final cs = Theme.of(context).colorScheme;

    if (reader.isLoadingTranslation) {
      return SizedBox(
        height: 250,
        child: Center(
          child: CircularProgressIndicator(color: cs.primary),
        ),
      );
    }

    if (reader.translationError != null) {
      return _buildError(context, reader.translationError!);
    }

    final translation = reader.activeTranslation;
    if (translation == null) {
      return const SizedBox(
        height: 100,
        child: Center(child: Text('No selection')),
      );
    }

    return _buildContent(context, translation);
  }

  Widget _buildError(BuildContext context, String error) {
    final cs = Theme.of(context).colorScheme;
    return SizedBox(
      height: 200,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded, color: cs.error, size: 40),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                error,
                textAlign: TextAlign.center,
                style: TextStyle(color: cs.onSurface.withValues(alpha: 0.7)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, RichTranslation translation) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DefaultTabController(
        length: 2,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHandle(cs),
            _buildHeader(context, cs, translation),
            TabBar(
              tabs: const [
                Tab(text: 'Grammar'),
                Tab(text: 'Examples'),
              ],
              indicatorSize: TabBarIndicatorSize.label,
              dividerColor: cs.onSurface.withValues(alpha: 0.06),
            ),
            Flexible(
              child: TabBarView(
                children: [
                  _GrammarTab(translation: translation),
                  _ExamplesTab(translation: translation),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHandle(ColorScheme cs) {
    return Center(
      child: Container(
        margin: const EdgeInsets.only(top: 12, bottom: 4),
        width: 36,
        height: 4,
        decoration: BoxDecoration(
          color: cs.onSurface.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    ColorScheme cs,
    RichTranslation info,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            info.segment,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 20,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            info.translation,
            style: TextStyle(
              fontSize: 15,
              color: cs.primary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _GrammarTab extends StatelessWidget {
  final RichTranslation translation;
  const _GrammarTab({required this.translation});

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
          Text(
            translation.grammar!.explanation,
            style: TextStyle(
              fontSize: 14,
              height: 1.6,
              color: cs.onSurface.withValues(alpha: 0.8),
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

class _ExamplesTab extends StatelessWidget {
  final RichTranslation translation;
  const _ExamplesTab({required this.translation});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        if (translation.alternatives.isNotEmpty) ...[
          Text(
            'Alternatives',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: translation.alternatives
                .map((alt) => Chip(
                      label: Text(alt, style: const TextStyle(fontSize: 13)),
                      backgroundColor: cs.secondary,
                      side: BorderSide.none,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                    ))
                .toList(),
          ),
          const SizedBox(height: 20),
        ],
        Text(
          'Examples',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: cs.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        if (translation.examples.isEmpty)
          Text(
            'No examples available.',
            style: TextStyle(
              fontStyle: FontStyle.italic,
              color: cs.onSurface.withValues(alpha: 0.5),
            ),
          )
        else
          ...translation.examples.map((ex) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ex.sentence,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              ex.translation,
                              style: TextStyle(
                                fontSize: 13,
                                color: cs.onSurface.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: Icon(
                          Icons.volume_up_rounded,
                          color: cs.primary,
                        ),
                        onPressed: () => ttsService.speak(
                          ex.sentence,
                          onProgress: (start, end) {},
                          onComplete: () {},
                        ),
                      ),
                    ],
                  ),
                ),
              )),
      ],
    );
  }
}
