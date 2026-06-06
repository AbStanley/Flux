import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/writing_model.dart';
import '../settings/settings_provider.dart';
import 'writing_provider.dart';

/// Custom controller that highlights writing corrections inline.
class WritingTextController extends TextEditingController {
  final List<WritingCorrection> corrections;

  WritingTextController({required this.corrections});

  @override
  TextSpan buildTextSpan({
    required BuildContext context,
    TextStyle? style,
    required bool withComposing,
  }) {
    if (corrections.isEmpty) {
      return super.buildTextSpan(
        context: context,
        style: style,
        withComposing: withComposing,
      );
    }

    final List<TextSpan> children = [];
    int lastIndex = 0;

    final sorted = List<WritingCorrection>.from(corrections)
      ..sort((a, b) => a.startIndex.compareTo(b.startIndex));

    for (final corr in sorted) {
      final start = corr.startIndex;
      final end = corr.endIndex;

      if (start < lastIndex || start > text.length || end > text.length) {
        continue;
      }

      if (start > lastIndex) {
        children.add(TextSpan(text: text.substring(lastIndex, start)));
      }

      children.add(TextSpan(
        text: text.substring(start, end),
        style: const TextStyle(
          backgroundColor: Color(0x22EF5350),
          decoration: TextDecoration.underline,
          decorationColor: Color(0xFFEF5350),
          decorationStyle: TextDecorationStyle.wavy,
          decorationThickness: 2.0,
        ),
      ));

      lastIndex = end;
    }

    if (lastIndex < text.length) {
      children.add(TextSpan(text: text.substring(lastIndex)));
    }

    return TextSpan(style: style, children: children);
  }
}

class WritingScreen extends StatefulWidget {
  const WritingScreen({super.key});

  @override
  State<WritingScreen> createState() => _WritingScreenState();
}

class _WritingScreenState extends State<WritingScreen> {
  late WritingTextController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WritingTextController(corrections: []);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WritingProvider>(context);
    final settings = Provider.of<SettingsProvider>(context);
    final cs = Theme.of(context).colorScheme;

    if (_controller.text != provider.text) {
      final cursorVal = _controller.selection;
      _controller.value = TextEditingValue(
        text: provider.text,
        selection: cursorVal,
      );
    }

    _controller = WritingTextController(corrections: provider.corrections);

    return SafeArea(
      child: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: TextField(
                controller: _controller,
                maxLines: null,
                expands: true,
                textAlignVertical: TextAlignVertical.top,
                style: TextStyle(
                  fontSize: 16,
                  height: 1.6,
                  color: cs.onSurface,
                ),
                decoration: InputDecoration(
                  hintText: 'Write in your target language...',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: cs.surface,
                ),
                onChanged: (val) => provider.setText(val),
              ),
            ),
          ),
          if (provider.corrections.isNotEmpty)
            _CorrectionStrip(corrections: provider.corrections, provider: provider),
          _buildActions(context, provider, settings, cs),
        ],
      ),
    );
  }

  Widget _buildActions(
    BuildContext context,
    WritingProvider provider,
    SettingsProvider settings,
    ColorScheme cs,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: cs.onSurface.withValues(alpha: 0.06)),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              Icons.delete_sweep_rounded,
              color: cs.onSurface.withValues(alpha: 0.4),
            ),
            onPressed: () => provider.clearAll(),
          ),
          const Spacer(),
          ElevatedButton.icon(
            icon: provider.isAnalyzing
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: cs.onPrimary,
                    ),
                  )
                : const Icon(Icons.auto_awesome_rounded, size: 18),
            label: Text(provider.isAnalyzing ? 'Analyzing...' : 'Polish'),
            onPressed: provider.isAnalyzing
                ? null
                : () => provider.checkText(
                      language: settings.sourceLanguage,
                      model: settings.selectedModel,
                    ),
          ),
        ],
      ),
    );
  }
}

/// Horizontal scrolling strip of correction cards.
class _CorrectionStrip extends StatelessWidget {
  final List<WritingCorrection> corrections;
  final WritingProvider provider;

  const _CorrectionStrip({
    required this.corrections,
    required this.provider,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: 130,
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
          top: BorderSide(color: cs.onSurface.withValues(alpha: 0.06)),
        ),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        itemCount: corrections.length,
        itemBuilder: (context, index) {
          final corr = corrections[index];
          return Card(
            margin: const EdgeInsets.only(right: 10),
            child: Container(
              width: 240,
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        corr.mistakeText,
                        style: TextStyle(
                          decoration: TextDecoration.lineThrough,
                          color: cs.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Icon(
                          Icons.arrow_forward_rounded,
                          size: 14,
                          color: cs.onSurface.withValues(alpha: 0.3),
                        ),
                      ),
                      Flexible(
                        child: Text(
                          corr.correctionText,
                          style: TextStyle(
                            color: cs.tertiary,
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Expanded(
                    child: Text(
                      corr.longDescription,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurface.withValues(alpha: 0.55),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => provider.dismissCorrection(corr),
                        child: const Text('Dismiss', style: TextStyle(fontSize: 11)),
                      ),
                      const SizedBox(width: 4),
                      ElevatedButton(
                        onPressed: () => provider.acceptCorrection(corr),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          minimumSize: const Size(0, 32),
                        ),
                        child: const Text('Fix', style: TextStyle(fontSize: 11)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
