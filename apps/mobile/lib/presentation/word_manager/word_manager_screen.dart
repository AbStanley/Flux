import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/models.dart';
import 'words_provider.dart';

class WordManagerScreen extends StatefulWidget {
  const WordManagerScreen({super.key});

  @override
  State<WordManagerScreen> createState() => _WordManagerScreenState();
}

class _WordManagerScreenState extends State<WordManagerScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_handleTabChange);
    
    // Initial fetch
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<WordsProvider>(context, listen: false).fetchWords(type: 'word');
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

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Words'),
            Tab(text: 'Phrases'),
          ],
        ),
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildWordList(context, provider.words),
                _buildWordList(context, provider.words),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddWordDialog(context, provider),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildWordList(BuildContext context, List<WordItem> items) {
    if (items.isEmpty) {
      return const Center(child: Text('No saved vocabulary found.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: ListTile(
            title: Text(
              item.text,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.definition),
                if (item.context != null && item.context!.isNotEmpty)
                  Text(
                    'Context: ${item.context}',
                    style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic),
                  ),
              ],
            ),
            trailing: IconButton(
              icon: const Icon(Icons.delete, color: Colors.redAccent),
              onPressed: () => _confirmDelete(context, item),
            ),
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, WordItem item) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete word?'),
        content: Text('Are you sure you want to delete "${item.text}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Provider.of<WordsProvider>(context, listen: false).deleteWord(item.id);
              Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showAddWordDialog(BuildContext context, WordsProvider provider) {
    final textController = TextEditingController();
    final defController = TextEditingController();
    final type = _tabController.index == 0 ? 'word' : 'phrase';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Add New ${type == 'word' ? 'Word' : 'Phrase'}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: textController,
              decoration: const InputDecoration(labelText: 'Vocabulary Text'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: defController,
              decoration: const InputDecoration(labelText: 'Definition'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (textController.text.isNotEmpty && defController.text.isNotEmpty) {
                provider.addWord({
                  'text': textController.text.trim(),
                  'definition': defController.text.trim(),
                  'type': type,
                  'sourceLanguage': 'es',
                  'targetLanguage': 'en',
                });
                Navigator.pop(context);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
