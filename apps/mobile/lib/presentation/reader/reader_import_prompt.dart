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
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 16),
          _buildHeroIcon(cs),
          const SizedBox(height: 20),
          Text('Ready to Read?', style: tt.titleLarge),
          const SizedBox(height: 6),
          Text(
            'Paste your own text or generate something with AI.',
            style: tt.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          _buildPasteCard(cs, tt, reader),
          const SizedBox(height: 8),
          _buildDividerBadge(cs, tt),
          const SizedBox(height: 8),
          _buildGenerateCard(cs, tt, reader),
          if (reader.generationError != null) ...[
            const SizedBox(height: 16),
            _buildErrorCard(cs, tt, reader.generationError!),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildHeroIcon(ColorScheme cs) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            cs.primary.withValues(alpha: 0.15),
            cs.tertiary.withValues(alpha: 0.10),
          ],
        ),
      ),
      child: Icon(Icons.menu_book_rounded, size: 40, color: cs.primary),
    );
  }

  Widget _buildPasteCard(ColorScheme cs, TextTheme tt, ReaderProvider reader) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.content_paste_rounded,
                    size: 18, color: cs.primary),
                const SizedBox(width: 8),
                Text('Paste Text', style: tt.titleMedium),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _textController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Paste target language content here...',
              ),
            ),
            const SizedBox(height: 14),
            FilledButton.icon(
              icon: const Icon(Icons.input_rounded, size: 18),
              label: const Text('Start Reading'),
              onPressed: reader.isGenerating
                  ? null
                  : () {
                      if (_textController.text.trim().isNotEmpty) {
                        reader.loadText(_textController.text.trim());
                      }
                    },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDividerBadge(ColorScheme cs, TextTheme tt) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          const Expanded(child: Divider()),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: cs.secondary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'OR GENERATE',
              style: tt.labelSmall?.copyWith(
                letterSpacing: 1.0,
                color: cs.onSurface.withValues(alpha: 0.55),
              ),
            ),
          ),
          const Expanded(child: Divider()),
        ],
      ),
    );
  }

  Widget _buildGenerateCard(
      ColorScheme cs, TextTheme tt, ReaderProvider reader) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.auto_awesome_rounded,
                    size: 18, color: cs.tertiary),
                const SizedBox(width: 8),
                Text('Generate with AI', style: tt.titleMedium),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _topicController,
              decoration: const InputDecoration(
                labelText: 'Topic',
                prefixIcon: Icon(Icons.topic_outlined, size: 20),
              ),
              enabled: !reader.isGenerating,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _selectedType,
              decoration: const InputDecoration(
                labelText: 'Content Type',
                prefixIcon: Icon(Icons.category_outlined, size: 20),
              ),
              borderRadius: BorderRadius.circular(12),
              items: const [
                DropdownMenuItem(value: 'Story', child: Text('Story')),
                DropdownMenuItem(
                    value: 'Monologue', child: Text('Monologue')),
                DropdownMenuItem(
                    value: 'Conversation', child: Text('Conversation')),
              ],
              onChanged: reader.isGenerating
                  ? null
                  : (val) {
                      if (val != null) setState(() => _selectedType = val);
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
                    topic: _topicController.text.trim(),
                    level: settings.proficiencyLevel,
                    sourceLang: settings.sourceLanguage,
                    contentType: _selectedType,
                    model: settings.selectedModel,
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorCard(ColorScheme cs, TextTheme tt, String error) {
    return Card(
      color: cs.error.withValues(alpha: 0.08),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: cs.error.withValues(alpha: 0.25)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Icon(Icons.error_outline_rounded, color: cs.error, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Generation failed: $error',
                style: tt.bodySmall?.copyWith(color: cs.error),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
