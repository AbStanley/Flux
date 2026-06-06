import 'package:flutter/material.dart';
import 'reader_provider.dart';
import 'translation_bottom_sheet.dart';

abstract class ReaderFooter {
  static Widget buildFooter(
      BuildContext context, ReaderProvider reader, ColorScheme cs) {
    return Container(
      color: cs.surface,
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (reader.selectedIndices.isNotEmpty)
            _buildSelectionPanel(context, reader, cs),
          _buildPagination(context, reader, cs),
        ],
      ),
    );
  }

  static Widget _buildPagination(
      BuildContext context, ReaderProvider reader, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(
        color: cs.secondary,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: Icon(Icons.chevron_left_rounded, color: cs.onSurface),
            onPressed: reader.currentPage > 1
                ? () => reader.setCurrentPage(reader.currentPage - 1)
                : null,
          ),
          Text(
            'Page ${reader.currentPage} of ${reader.totalPages.clamp(1, double.infinity).toInt()}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface,
                ),
          ),
          IconButton(
            icon: Icon(Icons.chevron_right_rounded, color: cs.onSurface),
            onPressed: reader.currentPage < reader.totalPages
                ? () => reader.setCurrentPage(reader.currentPage + 1)
                : null,
          ),
        ],
      ),
    );
  }

  static Widget _buildSelectionPanel(
      BuildContext context, ReaderProvider reader, ColorScheme cs) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: cs.primary.withValues(alpha: 0.15)),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Container(
              width: 4,
              decoration: BoxDecoration(
                color: cs.primary,
                borderRadius: const BorderRadius.horizontal(
                    left: Radius.circular(14)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      reader.selectedText.trim(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 2),
                    if (reader.isLoadingTranslation)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: const SizedBox(
                            height: 18, child: LinearProgressIndicator()),
                      )
                    else if (reader.activeTranslation != null)
                      Text(
                        reader.activeTranslation!.translation,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: cs.tertiary,
                              fontStyle: FontStyle.italic,
                            ),
                      )
                    else
                      Text('Fetching translation...',
                          style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ),
            IconButton(
              icon: Icon(Icons.open_in_new_rounded,
                  color: cs.primary, size: 20),
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => const TranslationBottomSheet(),
                );
              },
            ),
            IconButton(
              icon: Icon(Icons.close_rounded,
                  color: cs.onSurface.withValues(alpha: 0.5), size: 20),
              onPressed: () => reader.clearSelection(),
            ),
          ],
        ),
      ),
    );
  }
}
