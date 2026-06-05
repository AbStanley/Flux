import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
          _buildControlHeader(context, reader),
          Expanded(
            child: reader.text.isEmpty
                ? _buildImportPrompt(context, reader)
                : const ReaderTextView(),
          ),
          if (reader.text.isNotEmpty) _buildFooterControls(context, reader),
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

  Widget _buildImportPrompt(BuildContext context, ReaderProvider reader) {
    final textController = TextEditingController();
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.menu_book, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'Ready to read? Paste some text below:',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: textController,
            maxLines: 4,
            decoration: const InputDecoration(
              hintText: 'Paste target language content here...',
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.input),
            label: const Text('Start Reading'),
            onPressed: () {
              if (textController.text.trim().isNotEmpty) {
                reader.loadText(textController.text.trim());
              }
            },
          ),
        ],
      ),
    );
  }

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
