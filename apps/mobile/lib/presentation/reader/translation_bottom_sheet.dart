import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../domain/models.dart';
import 'examples_tab.dart';
import 'grammar_tab.dart';
import 'reader_provider.dart';

class TranslationBottomSheet extends StatelessWidget {
  const TranslationBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = Provider.of<ReaderProvider>(context);
    final cs = Theme.of(context).colorScheme;

    if (reader.isLoadingTranslation) {
      return SizedBox(
        height: 250,
        child: Center(
          child: CircularProgressIndicator(color: cs.primary),
        ),
      );
    }

    if (reader.translationError != null) {
      return _buildError(context, reader.translationError!);
    }

    final translation = reader.activeTranslation;
    if (translation == null) {
      return const SizedBox(
        height: 100,
        child: Center(child: Text('No selection')),
      );
    }

    return _buildContent(context, translation);
  }

  Widget _buildError(BuildContext context, String error) {
    final cs = Theme.of(context).colorScheme;
    return SizedBox(
      height: 200,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded, color: cs.error, size: 40),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                error,
                textAlign: TextAlign.center,
                style: TextStyle(color: cs.onSurface.withValues(alpha: 0.7)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, RichTranslation translation) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DefaultTabController(
        length: 2,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHandle(cs),
            _buildHeader(context, cs, translation),
            TabBar(
              tabs: const [
                Tab(text: 'Grammar'),
                Tab(text: 'Examples'),
              ],
              indicatorSize: TabBarIndicatorSize.label,
              dividerColor: cs.onSurface.withValues(alpha: 0.06),
            ),
            Flexible(
              child: TabBarView(
                children: [
                  GrammarTab(translation: translation),
                  ExamplesTab(translation: translation),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHandle(ColorScheme cs) {
    return Center(
      child: Container(
        margin: const EdgeInsets.only(top: 12, bottom: 4),
        width: 36,
        height: 4,
        decoration: BoxDecoration(
          color: cs.onSurface.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    ColorScheme cs,
    RichTranslation info,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            info.segment,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 20,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            info.translation,
            style: TextStyle(
              fontSize: 15,
              color: cs.primary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
