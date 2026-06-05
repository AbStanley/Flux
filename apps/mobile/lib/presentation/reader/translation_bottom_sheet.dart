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

    if (reader.isLoadingTranslation) {
      return const SizedBox(
        height: 250,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (reader.translationError != null) {
      return SizedBox(
        height: 200,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 40),
              const SizedBox(height: 10),
              Text(reader.translationError!, textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }

    final translation = reader.activeTranslation;
    if (translation == null) {
      return const SizedBox(
        height: 100,
        child: Center(child: Text('No selection')),
      );
    }

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      child: DefaultTabController(
        length: 2,
        child: Scaffold(
          appBar: AppBar(
            automaticallyImplyLeading: false,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  translation.segment,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                Text(
                  translation.translation,
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
            bottom: const TabBar(
              tabs: [
                Tab(text: 'Grammar & Details'),
                Tab(text: 'Examples & Alternatives'),
              ],
            ),
          ),
          body: TabBarView(
            children: [
              _buildGrammarTab(context, translation),
              _buildExamplesTab(context, translation),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGrammarTab(BuildContext context, RichTranslation info) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (info.grammar != null) ...[
          Text(
            'Part of Speech: ${info.grammar!.partOfSpeech.toUpperCase()}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          if (info.grammar!.infinitive != null)
            Text('Infinitive: ${info.grammar!.infinitive}'),
          if (info.grammar!.tense != null)
            Text('Tense: ${info.grammar!.tense}'),
          const SizedBox(height: 12),
          const Text('Explanation:', style: TextStyle(fontWeight: FontWeight.bold)),
          Text(info.grammar!.explanation),
        ] else
          const Text('No grammatical breakdown available.'),
        if (info.conjugations != null && info.conjugations!.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Conjugation Snippet:', style: TextStyle(fontWeight: FontWeight.bold)),
          _buildConjugations(context, info.conjugations!),
        ]
      ],
    );
  }

  Widget _buildExamplesTab(BuildContext context, RichTranslation info) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (info.alternatives.isNotEmpty) ...[
          const Text('Alternatives:', style: TextStyle(fontWeight: FontWeight.bold)),
          Text(info.alternatives.join(', ')),
          const SizedBox(height: 16),
        ],
        const Text('Examples:', style: TextStyle(fontWeight: FontWeight.bold)),
        if (info.examples.isEmpty)
          const Text('No examples available.')
        else
          ...info.examples.map((ex) => Card(
                margin: const EdgeInsets.symmetric(vertical: 6),
                child: ListTile(
                  title: Text(ex.sentence),
                  subtitle: Text(ex.translation),
                  trailing: IconButton(
                    icon: const Icon(Icons.volume_up),
                    onPressed: () => ttsService.speak(
                      ex.sentence,
                      onProgress: (start, end) {},
                      onComplete: () {},
                    ),
                  ),
                ),
              )),
      ],
    );
  }

  Widget _buildConjugations(BuildContext context, Map<String, List<ConjugationRow>> table) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: table.entries.map((entry) {
        return ExpansionTile(
          title: Text(entry.key),
          children: entry.value.map((row) {
            return ListTile(
              title: Text(row.pronoun),
              trailing: Text(
                row.conjugation,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).primaryColor,
                ),
              ),
            );
          }).toList(),
        );
      }).toList(),
    );
  }
}
