import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import 'reader_provider.dart';

class ReaderImportPrompt extends StatefulWidget {
  const ReaderImportPrompt({super.key});

  @override
  State<ReaderImportPrompt> createState() => _ReaderImportPromptState();
}

class _ReaderImportPromptState extends State<ReaderImportPrompt> {
  final _textController = TextEditingController();
  final _topicController = TextEditingController(text: 'Science fiction');
  String _selectedType = 'Story';

  @override
  void dispose() {
    _textController.dispose();
    _topicController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reader = Provider.of<ReaderProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.menu_book, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'Ready to read? Paste text or generate with AI:',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _textController,
            maxLines: 4,
            decoration: const InputDecoration(
              hintText: 'Paste target language content here...',
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.input),
            label: const Text('Start Reading'),
            onPressed: reader.isGenerating
                ? null
                : () {
                    if (_textController.text.trim().isNotEmpty) {
                      reader.loadText(_textController.text.trim());
                    }
                  },
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('OR GENERATE'),
                ),
                Expanded(child: Divider()),
              ],
            ),
          ),
          TextField(
            controller: _topicController,
            decoration: const InputDecoration(labelText: 'Topic'),
            enabled: !reader.isGenerating,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _selectedType,
            decoration: const InputDecoration(labelText: 'Content Type'),
            items: const [
              DropdownMenuItem(value: 'Story', child: Text('Story')),
              DropdownMenuItem(value: 'Monologue', child: Text('Monologue')),
              DropdownMenuItem(value: 'Conversation', child: Text('Conversation')),
            ],
            onChanged: reader.isGenerating
                ? null
                : (val) {
                    if (val != null) setState(() => _selectedType = val);
                  },
          ),
          const SizedBox(height: 16),
          if (reader.isGenerating)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: CircularProgressIndicator(),
            )
          else
            OutlinedButton.icon(
              icon: const Icon(Icons.auto_awesome),
              label: const Text('Generate with AI'),
              onPressed: () {
                final settings = Provider.of<SettingsProvider>(context, listen: false);
                reader.generateStory(
                  topic: _topicController.text.trim(),
                  level: settings.proficiencyLevel,
                  sourceLang: settings.sourceLanguage,
                  contentType: _selectedType,
                  model: settings.selectedModel,
                );
              },
            ),
          if (reader.generationError != null) ...[
            const SizedBox(height: 12),
            Text(
              'Generation failed: ${reader.generationError}',
              style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}
