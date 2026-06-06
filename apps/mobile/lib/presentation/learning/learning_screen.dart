import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import 'learning_provider.dart';

class LearningScreen extends StatefulWidget {
  const LearningScreen({super.key});

  @override
  State<LearningScreen> createState() => _LearningScreenState();
}

class _LearningScreenState extends State<LearningScreen> {
  final TextEditingController _topicController =
      TextEditingController(text: 'Travel');
  String _selectedMode = 'multiple-choice';

  @override
  void dispose() {
    _topicController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final game = Provider.of<LearningProvider>(context);
    final settings = Provider.of<SettingsProvider>(context);

    if (game.isLoading) return _buildLoading(context);
    if (game.activeGame == null) return _buildSetup(context, game, settings);
    if (game.isGameOver) return _buildGameOver(context, game);
    return _buildPlay(context, game);
  }

  Widget _buildLoading(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: cs.primary,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Generating content...',
            style: TextStyle(
              color: cs.onSurface.withValues(alpha: 0.6),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSetup(
    BuildContext context,
    LearningProvider game,
    SettingsProvider settings,
  ) {
    final cs = Theme.of(context).colorScheme;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 24),
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [cs.primary, cs.primary.withValues(alpha: 0.6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                Icons.extension_rounded,
                size: 40,
                color: cs.onPrimary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Learning Mode',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Text(
              'AI-generated vocabulary practice',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 32),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _topicController,
                      decoration: const InputDecoration(
                        labelText: 'Topic',
                        hintText: 'e.g. Restaurants, Business',
                        prefixIcon: Icon(Icons.topic_rounded),
                      ),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedMode,
                      decoration: const InputDecoration(
                        labelText: 'Format',
                        prefixIcon: Icon(Icons.style_rounded),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'multiple-choice',
                          child: Text('Multiple Choice Quiz'),
                        ),
                        DropdownMenuItem(
                          value: 'word-builder',
                          child: Text('Word Spelling Builder'),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedMode = val);
                      },
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text('Start Practice'),
                      onPressed: () => game.startGame(
                        mode: _selectedMode,
                        topic: _topicController.text.trim(),
                        level: settings.proficiencyLevel,
                        sourceLang: settings.sourceLanguage,
                        targetLang: settings.targetLanguage,
                        model: settings.selectedModel,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlay(BuildContext context, LearningProvider game) {
    final cs = Theme.of(context).colorScheme;
    final question = game.currentQuestion!;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: List.generate(5, (idx) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: Icon(
                        idx < game.health
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        color: idx < game.health
                            ? const Color(0xFFEF5350)
                            : cs.onSurface.withValues(alpha: 0.2),
                        size: 22,
                      ),
                    );
                  }),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: cs.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${game.score} pts',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: cs.primary,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              question.question,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: cs.onSurface,
              ),
            ),
            if (question.context != null &&
                question.context!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                question.context!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: cs.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],
            const Spacer(),
            ...question.choices.map((choice) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: OutlinedButton(
                    onPressed: () => game.submitAnswer(choice),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Text(
                        choice,
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                )),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildGameOver(BuildContext context, LearningProvider game) {
    final cs = Theme.of(context).colorScheme;
    final win = game.health > 0;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              win
                  ? Icons.emoji_events_rounded
                  : Icons.sentiment_very_dissatisfied_rounded,
              size: 72,
              color: win ? const Color(0xFFFFB300) : cs.error,
            ),
            const SizedBox(height: 16),
            Text(
              win ? 'Well Done!' : 'Practice Finished',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Final Score: ${game.score}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 28),
            ElevatedButton(
              onPressed: () => game.resetGame(),
              child: const Text('Back to Setup'),
            ),
          ],
        ),
      ),
    );
  }
}
