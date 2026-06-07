import 'package:flutter/material.dart';
import 'translation_popup_content.dart';

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
                child: TranslationPopupContent(
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
