import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/models.dart';
import 'words_provider.dart';

class WordManagerScreen extends StatefulWidget {
  const WordManagerScreen({super.key});

  @override
  State<WordManagerScreen> createState() => _WordManagerScreenState();
}

class _WordManagerScreenState extends State<WordManagerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_handleTabChange);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<WordsProvider>(context, listen: false)
          .fetchWords(type: 'word');
    });
  }

  void _handleTabChange() {
    if (_tabController.indexIsChanging) return;
    final type = _tabController.index == 0 ? 'word' : 'phrase';
    Provider.of<WordsProvider>(context, listen: false).fetchWords(type: type);
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WordsProvider>(context);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Container(
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: cs.onSurface.withValues(alpha: 0.06),
                  ),
                  bottom: BorderSide(
                    color: cs.onSurface.withValues(alpha: 0.06),
                  ),
                ),
              ),
              child: TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Words'),
                  Tab(text: 'Phrases'),
                ],
                indicatorSize: TabBarIndicatorSize.label,
              ),
            ),
            Expanded(
              child: provider.isLoading
                  ? Center(
                      child: CircularProgressIndicator(color: cs.primary),
                    )
                  : TabBarView(
                      controller: _tabController,
                      children: [
                        _WordList(items: provider.words, onDelete: _confirmDelete),
                        _WordList(items: provider.words, onDelete: _confirmDelete),
                      ],
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddWordDialog,
        backgroundColor: cs.primary,
        foregroundColor: cs.onPrimary,
        child: const Icon(Icons.add_rounded),
      ),
    );
  }

  void _confirmDelete(WordItem item) {
    final cs = Theme.of(context).colorScheme;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete word?'),
        content: Text('Remove "${item.text}" from your vocabulary?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Provider.of<WordsProvider>(context, listen: false)
                  .deleteWord(item.id);
              Navigator.pop(ctx);
            },
            child: Text('Delete', style: TextStyle(color: cs.error)),
          ),
        ],
      ),
    );
  }

  void _showAddWordDialog() {
    final provider = Provider.of<WordsProvider>(context, listen: false);
    final textCtrl = TextEditingController();
    final defCtrl = TextEditingController();
    final type = _tabController.index == 0 ? 'word' : 'phrase';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Add ${type == 'word' ? 'Word' : 'Phrase'}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: textCtrl,
              decoration: const InputDecoration(labelText: 'Vocabulary'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: defCtrl,
              decoration: const InputDecoration(labelText: 'Definition'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (textCtrl.text.isNotEmpty && defCtrl.text.isNotEmpty) {
                provider.addWord({
                  'text': textCtrl.text.trim(),
                  'definition': defCtrl.text.trim(),
                  'type': type,
                  'sourceLanguage': 'es',
                  'targetLanguage': 'en',
                });
                Navigator.pop(ctx);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

/// Extracted list widget for vocabulary items.
class _WordList extends StatelessWidget {
  final List<WordItem> items;
  final void Function(WordItem) onDelete;

  const _WordList({required this.items, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.bookmark_border_rounded,
              size: 48,
              color: cs.onSurface.withValues(alpha: 0.2),
            ),
            const SizedBox(height: 12),
            Text(
              'No saved vocabulary yet',
              style: TextStyle(
                color: cs.onSurface.withValues(alpha: 0.45),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.text,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: cs.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.definition,
                        style: TextStyle(
                          fontSize: 13,
                          color: cs.onSurface.withValues(alpha: 0.65),
                        ),
                      ),
                      if (item.context != null &&
                          item.context!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          item.context!,
                          style: TextStyle(
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                            color: cs.onSurface.withValues(alpha: 0.4),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(
                    Icons.delete_outline_rounded,
                    color: cs.error.withValues(alpha: 0.7),
                    size: 20,
                  ),
                  onPressed: () => onDelete(item),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
