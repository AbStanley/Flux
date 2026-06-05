import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/writing_model.dart';
import '../settings/settings_provider.dart';
import 'writing_provider.dart';

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
      return super.buildTextSpan(context: context, style: style, withComposing: withComposing);
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
          backgroundColor: Color(0x33FF5252),
          decoration: TextDecoration.underline,
          decorationColor: Colors.redAccent,
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

    // Sync provider text to controller when corrections update,
    // only if they differ (to avoid losing cursor selection on typing).
    if (_controller.text != provider.text) {
      final cursorVal = _controller.selection;
      _controller.value = TextEditingValue(
        text: provider.text,
        selection: cursorVal,
      );
    }

    // Keep controller corrections list synced
    _controller = WritingTextController(corrections: provider.corrections);

    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _controller,
                maxLines: null,
                expands: true,
                textAlignVertical: TextAlignVertical.top,
                decoration: const InputDecoration(
                  hintText: 'Type or paste your foreign language writing text here...',
                  alignLabelWithHint: true,
                ),
                onChanged: (val) => provider.setText(val),
              ),
            ),
          ),
          if (provider.corrections.isNotEmpty) _buildCorrectionsList(context, provider),
          _buildActionPanel(context, provider, settings),
        ],
      ),
    );
  }

  Widget _buildCorrectionsList(BuildContext context, WritingProvider provider) {
    return Container(
      height: 140,
      color: Theme.of(context).cardTheme.color,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemCount: provider.corrections.length,
        itemBuilder: (context, index) {
          final corr = provider.corrections[index];
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 6),
            child: Container(
              width: 250,
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        corr.mistakeText,
                        style: const TextStyle(
                          decoration: TextDecoration.lineThrough,
                          color: Colors.redAccent,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Icon(Icons.arrow_forward, size: 16),
                      Text(
                        corr.correctionText,
                        style: const TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    corr.longDescription,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12),
                  ),
                  const Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => provider.dismissCorrection(corr),
                        child: const Text('Dismiss', style: TextStyle(fontSize: 11)),
                      ),
                      ElevatedButton(
                        onPressed: () => provider.acceptCorrection(corr),
                        child: const Text('Correct', style: TextStyle(fontSize: 11)),
                      ),
                    ],
                  )
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionPanel(
    BuildContext context,
    WritingProvider provider,
    SettingsProvider settings,
  ) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.delete_sweep),
            onPressed: () => provider.clearAll(),
          ),
          ElevatedButton.icon(
            icon: provider.isAnalyzing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.auto_awesome),
            label: Text(provider.isAnalyzing ? 'Analyzing...' : 'Polish Writing'),
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
