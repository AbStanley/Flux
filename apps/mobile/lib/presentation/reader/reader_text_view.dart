import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import 'reader_provider.dart';

class ReaderTextView extends StatelessWidget {
  const ReaderTextView({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = Provider.of<ReaderProvider>(context);
    final settings = Provider.of<SettingsProvider>(context, listen: false);
    final pageTokens = reader.currentPageTokens;
    final startIndex = (reader.currentPage - 1) * reader.pageSize;

    if (pageTokens.isEmpty) {
      return const Center(
        child: Text(
          'No text loaded. Use the import buttons below to add text.',
          textAlign: TextAlign.center,
          style: TextStyle(fontStyle: FontStyle.italic, fontSize: 16),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Wrap(
        alignment: WrapAlignment.start,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: List.generate(pageTokens.length, (index) {
          final globalIndex = startIndex + index;
          final token = pageTokens[index];

          // Whitespace check
          if (token.trim().isEmpty) {
            return Text(token, style: const TextStyle(fontSize: 20));
          }

          final isSelected = reader.selectedIndices.contains(globalIndex);
          final isPlaying = reader.currentAudioTokenIndex == globalIndex;

          Color? textColor;
          Color? bgColor;
          TextDecoration decoration = TextDecoration.none;

          if (isPlaying) {
            bgColor = Theme.of(context).primaryColor.withValues(alpha: 0.35);
          } else if (isSelected) {
            bgColor = Theme.of(context).colorScheme.primary.withValues(alpha: 0.15);
            decoration = TextDecoration.underline;
          }

          return GestureDetector(
            onTap: () => reader.handleSelection(index, settings.selectedModel),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 1),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                token,
                style: TextStyle(
                  fontSize: 20,
                  color: textColor,
                  decoration: decoration,
                  height: 1.5,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
