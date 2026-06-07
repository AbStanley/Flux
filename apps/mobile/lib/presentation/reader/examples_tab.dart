import 'package:flutter/material.dart';
import '../../domain/models.dart';
import '../../infrastructure/tts_service.dart';

class ExamplesTab extends StatelessWidget {
  final RichTranslation translation;
  const ExamplesTab({super.key, required this.translation});

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
