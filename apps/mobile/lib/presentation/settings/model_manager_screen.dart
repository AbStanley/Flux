import 'dart:async';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/llm_types.dart';
import '../../infrastructure/llm/local_model_manager.dart';
import 'model_card.dart';
import '../settings/settings_provider.dart';

/// Screen for downloading, managing, and selecting on-device Gemma models.
class ModelManagerScreen extends StatefulWidget {
  const ModelManagerScreen({super.key});
  @override
  State<ModelManagerScreen> createState() => _ModelManagerScreenState();
}

class _ModelManagerScreenState extends State<ModelManagerScreen> {
  final Map<String, double> _downloadProgress = {};
  final Map<String, StreamSubscription<double>> _activeSubs = {};

  @override
  void dispose() {
    for (final sub in _activeSubs.values) {
      sub.cancel();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsProvider>(context);
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('On-Device Models')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildInfoBanner(cs, tt),
          const SizedBox(height: 16),
          ...settings.localModels.map(
            (model) => ModelCard(
              model: model,
              isSelected: settings.selectedLocalModel == model.id,
              isDownloading: _downloadProgress.containsKey(model.id),
              downloadProgress: _downloadProgress[model.id] ?? 0.0,
              onDownload: () => _startDownload(model, settings),
              onImport: () => _importModel(context, model, settings),
              onSelect: () => settings.updateSelectedLocalModel(model.id),
              onDelete: () => _confirmDelete(context, model, settings),
            ),
          ),
          if (settings.localModels.isEmpty) _buildEmptyState(cs, tt),
        ],
      ),
    );
  }

  Widget _buildInfoBanner(ColorScheme cs, TextTheme tt) {
    return Card(
      color: cs.primary.withValues(alpha: 0.08),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Icon(Icons.info_outline_rounded, color: cs.primary, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Download models to run AI directly on your device. '
                'No server or internet required after download.',
                style: tt.bodySmall?.copyWith(
                  color: cs.onSurface.withValues(alpha: 0.8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme tt) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Text(
          'No models available.\nEnsure you are running on Android.',
          textAlign: TextAlign.center,
          style: tt.bodyMedium?.copyWith(
            color: cs.onSurface.withValues(alpha: 0.5),
          ),
        ),
      ),
    );
  }

  void _startDownload(LocalModelInfo model, SettingsProvider settings) {
    setState(() => _downloadProgress[model.id] = 0.0);

    final sub = localModelManager.downloadModel(model.id).listen(
      (progress) {
        setState(() => _downloadProgress[model.id] = progress);
      },
      onDone: () {
        setState(() => _downloadProgress.remove(model.id));
        settings.refreshLocalModels();
      },
      onError: (e) {
        setState(() => _downloadProgress.remove(model.id));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Download failed: $e')),
          );
        }
      },
    );
    _activeSubs[model.id] = sub;
  }

  Future<void> _importModel(
    BuildContext context,
    LocalModelInfo model,
    SettingsProvider settings,
  ) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.any,
      );

      if (result == null || result.files.single.path == null) {
        return;
      }

      final filePath = result.files.single.path!;
      if (!filePath.endsWith('.litertlm')) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please select a file with the .litertlm extension.')),
          );
        }
        return;
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Importing ${model.displayName}... Please wait.')),
        );
      }

      final success = await localModelManager.importModelFile(model.id, filePath);

      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${model.displayName} imported successfully!')),
          );
          settings.refreshLocalModels();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to import model file. Make sure the file is not corrupted.')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error selecting file: $e')),
        );
      }
    }
  }

  void _confirmDelete(
    BuildContext context,
    LocalModelInfo model,
    SettingsProvider settings,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Model?'),
        content: Text(
          'Remove ${model.displayName} from device? '
          'You can re-download it later.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await localModelManager.deleteModel(model.id);
              settings.refreshLocalModels();
            },
            child: Text('Delete',
                style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ),
        ],
      ),
    );
  }
}
