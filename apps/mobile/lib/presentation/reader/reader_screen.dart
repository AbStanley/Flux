import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_screen.dart';
import 'reader_footer.dart';
import 'reader_import_prompt.dart';
import 'reader_provider.dart';
import 'reader_text_view.dart';
import 'translation_popup.dart';

class ReaderScreen extends StatelessWidget {
  const ReaderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = Provider.of<ReaderProvider>(context);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: Column(
        children: [
          _buildAppBar(context, reader, cs),
          if (reader.isGenerating)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        color: cs.primary,
                        backgroundColor: cs.primary.withValues(alpha: 0.12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: Icon(Icons.stop_circle_outlined, color: cs.error, size: 24),
                    tooltip: 'Stop Generating',
                    onPressed: () => reader.cancelGeneration(),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
          _buildModeBar(context, reader, cs),
          Expanded(
            child: (reader.text.isEmpty && !reader.isGenerating)
                ? const ReaderImportPrompt()
                : const ReaderTextView(),
          ),
          if (reader.text.isNotEmpty || reader.isGenerating)
            ReaderFooter.buildFooter(context, reader, cs),
        ],
      ),
    );
  }

  Widget _buildAppBar(
      BuildContext context, ReaderProvider reader, ColorScheme cs) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 20, right: 8, bottom: 8,
      ),
      color: cs.surface,
      child: Row(
        children: [
          Text('Reader', style: Theme.of(context).textTheme.titleLarge),
          const Spacer(),
          if (reader.text.isNotEmpty)
            IconButton(
              icon: Icon(Icons.delete_sweep, color: cs.error),
              tooltip: 'Clear Text',
              onPressed: () {
                TranslationPopup.dismiss();
                reader.clearText();
                reader.notify();
              },
            ),
          IconButton(
            icon: Icon(Icons.settings_outlined, color: cs.onSurface),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildModeBar(
      BuildContext context, ReaderProvider reader, ColorScheme cs) {
    return Container(
      color: cs.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Expanded(child: _buildModePicker(context, reader, cs)),
          const SizedBox(width: 12),
          _buildTtsControls(reader, cs),
        ],
      ),
    );
  }

  Widget _buildModePicker(
      BuildContext context, ReaderProvider reader, ColorScheme cs) {
    return Row(
      children: SelectionMode.values.map((mode) {
        final isActive = reader.selectionMode == mode;
        return Padding(
          padding: const EdgeInsets.only(right: 6),
          child: GestureDetector(
            onTap: () => reader.setSelectionMode(mode),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isActive ? cs.primary : cs.secondary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                mode.name[0].toUpperCase() + mode.name.substring(1),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: isActive ? cs.onPrimary : cs.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTtsControls(ReaderProvider reader, ColorScheme cs) {
    return Container(
      decoration: BoxDecoration(
        color: cs.secondary,
        borderRadius: BorderRadius.circular(24),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: Icon(
              reader.isPlayingAudio
                  ? Icons.pause_rounded
                  : Icons.play_arrow_rounded,
              color: cs.primary,
              size: 22,
            ),
            onPressed: () => reader.isPlayingAudio
                ? reader.pauseAudio()
                : reader.playAudio(),
            visualDensity: VisualDensity.compact,
          ),
          IconButton(
            icon: Icon(Icons.stop_rounded, color: cs.onSurface, size: 22),
            onPressed: () => reader.stopAudio(),
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }
}
