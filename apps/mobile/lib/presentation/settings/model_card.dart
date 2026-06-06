import 'package:flutter/material.dart';
import '../../domain/llm_types.dart';

/// Individual card displaying a local model's info, status, and actions.
class ModelCard extends StatelessWidget {
  final LocalModelInfo model;
  final bool isSelected;
  final bool isDownloading;
  final double downloadProgress;
  final VoidCallback onDownload;
  final VoidCallback onImport;
  final VoidCallback onSelect;
  final VoidCallback onDelete;

  const ModelCard({
    super.key,
    required this.model,
    required this.isSelected,
    required this.isDownloading,
    required this.downloadProgress,
    required this.onDownload,
    required this.onImport,
    required this.onSelect,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: isSelected && model.isDownloaded
            ? BorderSide(color: cs.primary, width: 1.5)
            : BorderSide.none,
      ),
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(cs, tt),
            const SizedBox(height: 8),
            _buildMeta(cs),
            const SizedBox(height: 12),
            if (isDownloading)
              _buildProgressBar(cs)
            else
              _buildActions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ColorScheme cs, TextTheme tt) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: cs.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(Icons.memory_rounded, color: cs.primary, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(model.displayName, style: tt.titleSmall),
              Text(
                '${model.parameterCount} parameters • ${model.formattedSize}',
                style: tt.bodySmall?.copyWith(
                  color: cs.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
        ),
        if (isSelected && model.isDownloaded)
          Icon(Icons.check_circle_rounded, color: cs.primary, size: 22),
      ],
    );
  }

  Widget _buildMeta(ColorScheme cs) {
    return Row(
      children: [
        _chip(cs, model.isDownloaded ? 'Downloaded' : 'Not downloaded',
            model.isDownloaded ? Colors.green : cs.outline),
        const SizedBox(width: 8),
        _chip(cs, model.parameterCount == '2B' ? 'Faster' : 'Smarter',
            cs.tertiary),
      ],
    );
  }

  Widget _chip(ColorScheme cs, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }

  Widget _buildProgressBar(ColorScheme cs) {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: downloadProgress,
            minHeight: 8,
            backgroundColor: cs.onSurface.withValues(alpha: 0.1),
            valueColor: AlwaysStoppedAnimation(cs.primary),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${(downloadProgress * 100).toInt()}%',
          style: TextStyle(
            fontSize: 12,
            color: cs.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }

  Widget _buildActions(BuildContext context) {
    if (!model.isDownloaded) {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.download_rounded, size: 18),
              label: Text('Download (${model.formattedSize})'),
              onPressed: onDownload,
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.folder_open_rounded, size: 18),
              label: const Text('Import Model (.litertlm)'),
              onPressed: onImport,
            ),
          ),
        ],
      );
    }
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            icon: const Icon(Icons.check_rounded, size: 18),
            label: const Text('Select'),
            onPressed: isSelected ? null : onSelect,
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          icon: Icon(Icons.delete_outline_rounded,
              color: Theme.of(context).colorScheme.error),
          onPressed: onDelete,
        ),
      ],
    );
  }
}
