import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'reader_import_prompt.dart';
import 'reader_provider.dart';
import 'reader_text_view.dart';
import 'translation_bottom_sheet.dart';

class ReaderScreen extends StatelessWidget {
  const ReaderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = Provider.of<ReaderProvider>(context);

    return Scaffold(
      body: Column(
        children: [
          if (reader.isGenerating)
            const LinearProgressIndicator(),
          _buildControlHeader(context, reader),
          Expanded(
            child: (reader.text.isEmpty && !reader.isGenerating)
                ? const ReaderImportPrompt()
                : const ReaderTextView(),
          ),
          if (reader.text.isNotEmpty || reader.isGenerating) _buildFooterControls(context, reader),
        ],
      ),
    );
  }

  Widget _buildControlHeader(BuildContext context, ReaderProvider reader) {
    return Container(
      color: Theme.of(context).cardTheme.color,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          DropdownButton<SelectionMode>(
            value: reader.selectionMode,
            underline: const SizedBox(),
            items: SelectionMode.values.map((mode) {
              return DropdownMenuItem(
                value: mode,
                child: Text(mode.name.toUpperCase()),
              );
            }).toList(),
            onChanged: (val) {
              if (val != null) reader.setSelectionMode(val);
            },
          ),
          Row(
            children: [
              IconButton(
                icon: Icon(
                  reader.isPlayingAudio ? Icons.pause : Icons.play_arrow,
                  color: Theme.of(context).primaryColor,
                ),
                onPressed: () {
                  if (reader.isPlayingAudio) {
                    reader.pauseAudio();
                  } else {
                    reader.playAudio();
                  }
                },
              ),
              IconButton(
                icon: const Icon(Icons.stop),
                onPressed: () => reader.stopAudio(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Import prompt is now handled by ReaderImportPrompt in reader_import_prompt.dart

  Widget _buildFooterControls(BuildContext context, ReaderProvider reader) {
    return Container(
      color: Theme.of(context).cardTheme.color,
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (reader.selectedIndices.isNotEmpty)
            _buildSelectionPanel(context, reader),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: reader.currentPage > 1
                    ? () => reader.setCurrentPage(reader.currentPage - 1)
                    : null,
              ),
              Text(
                'Page ${reader.currentPage} of ${reader.totalPages.clamp(1, double.infinity).toInt()}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: reader.currentPage < reader.totalPages
                    ? () => reader.setCurrentPage(reader.currentPage + 1)
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSelectionPanel(BuildContext context, ReaderProvider reader) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reader.selectedText.trim(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  if (reader.isLoadingTranslation)
                    const SizedBox(
                      height: 20,
                      child: LinearProgressIndicator(),
                    )
                  else if (reader.activeTranslation != null)
                    Text(
                      reader.activeTranslation!.translation,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    )
                  else
                    const Text('Fetching translation...'),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.launch),
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => const TranslationBottomSheet(),
                );
              },
            ),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => reader.clearSelection(),
            ),
          ],
        ),
      ),
    );
  }
}
