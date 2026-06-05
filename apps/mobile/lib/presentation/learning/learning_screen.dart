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
  final TextEditingController _topicController = TextEditingController(text: 'Travel');
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

    if (game.isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Generating gamified AI content...'),
          ],
        ),
      );
    }

    if (game.activeGame == null) {
      return _buildSetupScreen(context, game, settings);
    }

    if (game.isGameOver) {
      return _buildGameOverScreen(context, game);
    }

    return _buildPlayScreen(context, game);
  }

  Widget _buildSetupScreen(BuildContext context, LearningProvider game, SettingsProvider settings) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.sports_esports, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          TextField(
            controller: _topicController,
            decoration: const InputDecoration(
              labelText: 'Game Topic',
              hintText: 'e.g. Restaurants, Business meetings',
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _selectedMode,
            decoration: const InputDecoration(labelText: 'Game Format'),
            items: const [
              DropdownMenuItem(value: 'multiple-choice', child: Text('Multiple Choice Quiz')),
              DropdownMenuItem(value: 'word-builder', child: Text('Word Spelling Builder')),
            ],
            onChanged: (val) {
              if (val != null) setState(() => _selectedMode = val);
            },
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            icon: const Icon(Icons.play_arrow),
            label: const Text('Start Practice Session'),
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
    );
  }

  Widget _buildPlayScreen(BuildContext context, LearningProvider game) {
    final question = game.currentQuestion!;

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: List.generate(5, (idx) {
                  return Icon(
                    idx < game.health ? Icons.favorite : Icons.favorite_border,
                    color: Colors.red,
                  );
                }),
              ),
              Text('Score: ${game.score}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const Spacer(),
          Text(
            question.question,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          if (question.context != null && question.context!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              'Context: ${question.context}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, fontStyle: FontStyle.italic),
            ),
          ],
          const Spacer(),
          ...question.choices.map((choice) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: OutlinedButton(
                  onPressed: () => game.submitAnswer(choice),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(choice, style: const TextStyle(fontSize: 18)),
                  ),
                ),
              )),
          const Spacer(),
        ],
      ),
    );
  }

  Widget _buildGameOverScreen(BuildContext context, LearningProvider game) {
    final win = game.health > 0;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              win ? Icons.emoji_events : Icons.sentiment_very_dissatisfied,
              size: 80,
              color: win ? Colors.amber : Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              win ? 'Well Done!' : 'Practice Finished',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text('Final Score: ${game.score}'),
            const SizedBox(height: 24),
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
