import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import 'reader_provider.dart';
import 'translation_bottom_sheet.dart';
import 'translation_popup.dart';

class ReaderTextView extends StatelessWidget {
  const ReaderTextView({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = Provider.of<ReaderProvider>(context);
    final settings = Provider.of<SettingsProvider>(context, listen: false);
    final pageTokens = reader.currentPageTokens;
    final startIndex = (reader.currentPage - 1) * reader.pageSize;
    final cs = Theme.of(context).colorScheme;

    if (pageTokens.isEmpty) {
      return Center(
        child: Text(
          'No text loaded. Use the import buttons below to add text.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontStyle: FontStyle.italic,
            fontSize: 15,
            color: cs.onSurface.withValues(alpha: 0.45),
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Wrap(
        alignment: WrapAlignment.start,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: List.generate(pageTokens.length, (index) {
          final globalIndex = startIndex + index;
          final token = pageTokens[index];

          if (token.trim().isEmpty) {
            return Text(token, style: const TextStyle(fontSize: 19));
          }

          final isSelected = reader.selectedIndices.contains(globalIndex);
          final isPlaying = reader.currentAudioTokenIndex == globalIndex;

          return GestureDetector(
            onTapDown: (details) {
              reader.handleSelection(index, settings.selectedModel);
              TranslationPopup.show(
                context: context,
                tapPosition: details.globalPosition,
                word: token,
                targetLanguage: settings.targetLanguage,
                model: settings.selectedModel,
                onShowDetails: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (context) => const TranslationBottomSheet(),
                  );
                },
              );
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOut,
              padding: const EdgeInsets.symmetric(horizontal: 1, vertical: 2),
              decoration: BoxDecoration(
                color: isPlaying
                    ? cs.primary.withValues(alpha: 0.25)
                    : isSelected
                        ? cs.primary.withValues(alpha: 0.12)
                        : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                token,
                style: TextStyle(
                  fontSize: 19,
                  color: isSelected
                      ? cs.primary
                      : cs.onSurface,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  decoration: isSelected
                      ? TextDecoration.underline
                      : TextDecoration.none,
                  decorationColor: cs.primary.withValues(alpha: 0.4),
                  decorationStyle: TextDecorationStyle.dotted,
                  height: 1.65,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
