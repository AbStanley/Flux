import 'package:flutter/material.dart';
import '../../domain/llm_types.dart';
import 'model_manager_screen.dart';
import 'settings_provider.dart';

/// Card widget for choosing between server and on-device inference.
class InferenceSourceCard extends StatelessWidget {
  final SettingsProvider settings;
  const InferenceSourceCard({super.key, required this.settings});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              Icon(Icons.smart_toy_rounded, size: 20, color: cs.primary),
              const SizedBox(width: 8),
              Text('Inference Source',
                  style: tt.titleMedium?.copyWith(color: cs.primary)),
            ]),
            const SizedBox(height: 14),
            SegmentedButton<LlmMode>(
              segments: const [
                ButtonSegment(
                  value: LlmMode.server,
                  label: Text('Backend'),
                  icon: Icon(Icons.cloud_outlined, size: 18),
                ),
                ButtonSegment(
                  value: LlmMode.local,
                  label: Text('On-Device'),
                  icon: Icon(Icons.phone_android_rounded, size: 18),
                ),
              ],
              selected: {settings.llmMode},
              onSelectionChanged: (sel) => settings.updateLlmMode(sel.first),
            ),
            const SizedBox(height: 12),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: settings.isLocalMode
                  ? _buildLocalSection(context, cs, tt)
                  : _buildServerHint(cs, tt),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServerHint(ColorScheme cs, TextTheme tt) {
    return Padding(
      key: const ValueKey('server-hint'),
      padding: const EdgeInsets.only(top: 4),
      child: Text(
        'AI runs on your NestJS + Ollama backend.',
        style: tt.bodySmall?.copyWith(
          color: cs.onSurface.withValues(alpha: 0.5),
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  Widget _buildLocalSection(BuildContext context, ColorScheme cs, TextTheme tt) {
    final downloaded = settings.localModels.where((m) => m.isDownloaded).toList();
    return Column(
      key: const ValueKey('local-section'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (downloaded.isNotEmpty) ...[
          DropdownButtonFormField<String>(
            initialValue: settings.selectedLocalModel,
            decoration: InputDecoration(
              labelText: 'On-Device Model',
              suffixIcon: settings.isLoadingModel
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: Padding(
                        padding: EdgeInsets.all(4.0),
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
            ),
            items: downloaded
                .map((m) => DropdownMenuItem(
                      value: m.id,
                      child: Text(m.displayName),
                    ))
                .toList(),
            onChanged: settings.isLoadingModel
                ? null
                : (id) {
                    if (id != null) settings.updateSelectedLocalModel(id);
                  },
          ),
          if (settings.isLoadingModel) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 1.5),
                ),
                const SizedBox(width: 8),
                Text(
                  'Loading model into RAM...',
                  style: tt.bodySmall?.copyWith(
                    color: cs.primary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
        ] else
          _warningTile(cs, tt,
              'No models downloaded yet. Tap "Manage Models" to download one.'),
        const SizedBox(height: 4),
        OutlinedButton.icon(
          icon: const Icon(Icons.download_rounded, size: 18),
          label: const Text('Manage Models'),
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ModelManagerScreen()),
          ),
        ),
      ],
    );
  }

  Widget _warningTile(ColorScheme cs, TextTheme tt, String msg) => Card(
        color: cs.error.withValues(alpha: 0.08),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Icon(Icons.warning_amber_rounded, color: cs.error, size: 20),
            const SizedBox(width: 10),
            Expanded(
                child: Text(msg,
                    style: tt.bodySmall?.copyWith(color: cs.error))),
          ]),
        ),
      );
}
