import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'reader_provider.dart';

class TranslationPopup {
  static OverlayEntry? _currentEntry;

  static void dismiss() {
    if (_currentEntry != null) {
      _currentEntry!.remove();
      _currentEntry = null;
    }
  }

  static void show({
    required BuildContext context,
    required Offset tapPosition,
    required String word,
    required String targetLanguage,
    required String model,
    required VoidCallback onShowDetails,
  }) {
    dismiss();

    final overlayState = Overlay.of(context);
    final size = MediaQuery.of(context).size;
    final showBelow = tapPosition.dy < 180;

    _currentEntry = OverlayEntry(
      builder: (context) {
        return Stack(
          children: [
            GestureDetector(
              behavior: HitTestBehavior.translucent,
              onTap: dismiss,
              child: Container(
                color: Colors.black.withValues(alpha: 0.05),
                width: size.width,
                height: size.height,
              ),
            ),
            Positioned(
              left: (tapPosition.dx - 120).clamp(12.0, size.width - 252.0),
              top: showBelow ? tapPosition.dy + 28 : null,
              bottom: showBelow ? null : size.height - tapPosition.dy + 16,
              child: Material(
                color: Colors.transparent,
                child: _PopupContent(
                  word: word,
                  targetLanguage: targetLanguage,
                  model: model,
                  onShowDetails: onShowDetails,
                ),
              ),
            ),
          ],
        );
      },
    );

    overlayState.insert(_currentEntry!);
  }
}

/// Extracted widget for the popup card content.
class _PopupContent extends StatelessWidget {
  final String word;
  final String targetLanguage;
  final String model;
  final VoidCallback onShowDetails;

  const _PopupContent({
    required this.word,
    required this.targetLanguage,
    required this.model,
    required this.onShowDetails,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final wordCount = word.trim().split(RegExp(r'\s+')).length;
    final isPhrase = wordCount > 1;

    return FutureBuilder<String>(
      future: Provider.of<ReaderProvider>(context, listen: false)
          .translateTextSimple(word, targetLanguage, model),
      builder: (context, snapshot) {
        final isLoading =
            snapshot.connectionState == ConnectionState.waiting;
        final translation = snapshot.data ?? '';

        return ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
            child: Container(
              width: 240,
              decoration: BoxDecoration(
                color: cs.surface.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: cs.onSurface.withValues(alpha: 0.08),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(14),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(context, cs, isPhrase, wordCount),
                  const SizedBox(height: 6),
                  _buildWord(cs),
                  const SizedBox(height: 10),
                  if (isLoading)
                    _buildLoader(cs)
                  else
                    _buildResult(context, cs, translation),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(
    BuildContext context,
    ColorScheme cs,
    bool isPhrase,
    int count,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: cs.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            isPhrase ? 'PHRASE · $count WORDS' : 'WORD',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 10,
              color: cs.primary,
              letterSpacing: 0.6,
            ),
          ),
        ),
        const Spacer(),
        GestureDetector(
          onTap: TranslationPopup.dismiss,
          child: Icon(
            Icons.close_rounded,
            size: 16,
            color: cs.onSurface.withValues(alpha: 0.35),
          ),
        ),
      ],
    );
  }

  Widget _buildWord(ColorScheme cs) {
    return Text(
      word.trim(),
      style: TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 16,
        color: cs.primary,
      ),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }

  Widget _buildLoader(ColorScheme cs) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: cs.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildResult(
    BuildContext context,
    ColorScheme cs,
    String translation,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          translation.trim().isEmpty ? 'No translation' : translation,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            height: 1.4,
            color: cs.onSurface,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 10),
        Divider(color: cs.onSurface.withValues(alpha: 0.08)),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: Icon(Icons.volume_up_rounded, size: 18, color: cs.primary),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              onPressed: () {
                Provider.of<ReaderProvider>(context, listen: false)
                    .speakSingleWord(word);
              },
            ),
            TextButton.icon(
              onPressed: () {
                TranslationPopup.dismiss();
                onShowDetails();
              },
              icon: Icon(Icons.arrow_forward_rounded, size: 14, color: cs.primary),
              label: Text('Details', style: TextStyle(fontSize: 12, color: cs.primary)),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
