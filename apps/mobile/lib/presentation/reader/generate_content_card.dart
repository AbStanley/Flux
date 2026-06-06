import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import 'reader_provider.dart';

/// Card section for AI content generation (topic, type, generate button).
class GenerateContentCard extends StatelessWidget {
  final TextEditingController topicController;
  final String selectedType;
  final ValueChanged<String> onTypeChanged;
  final ReaderProvider reader;

  const GenerateContentCard({
    super.key,
    required this.topicController,
    required this.selectedType,
    required this.onTypeChanged,
    required this.reader,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.auto_awesome_rounded, size: 18, color: cs.tertiary),
                const SizedBox(width: 8),
                Text('Generate with AI', style: tt.titleMedium),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: topicController,
              decoration: const InputDecoration(
                labelText: 'Topic',
                prefixIcon: Icon(Icons.topic_outlined, size: 20),
              ),
              enabled: !reader.isGenerating,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: selectedType,
              decoration: const InputDecoration(
                labelText: 'Content Type',
                prefixIcon: Icon(Icons.category_outlined, size: 20),
              ),
              borderRadius: BorderRadius.circular(12),
              items: const [
                DropdownMenuItem(value: 'Story', child: Text('Story')),
                DropdownMenuItem(value: 'Monologue', child: Text('Monologue')),
                DropdownMenuItem(
                  value: 'Conversation',
                  child: Text('Conversation'),
                ),
              ],
              onChanged: reader.isGenerating
                  ? null
                  : (val) {
                      if (val != null) onTypeChanged(val);
                    },
            ),
            const SizedBox(height: 16),
            if (reader.isGenerating)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 6),
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                ),
              )
            else
              OutlinedButton.icon(
                icon: const Icon(Icons.auto_awesome, size: 18),
                label: const Text('Generate with AI'),
                onPressed: () {
                  final settings =
                      Provider.of<SettingsProvider>(context, listen: false);
                  reader.generateStory(
                    topic: topicController.text.trim(),
                    level: settings.proficiencyLevel,
                    sourceLang: settings.sourceLanguage,
                    contentType: selectedType,
                    model: settings.selectedModel,
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
