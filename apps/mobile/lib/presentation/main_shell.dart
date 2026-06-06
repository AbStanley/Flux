import 'package:flutter/material.dart';
import 'reader/reader_screen.dart';
import 'learning/learning_screen.dart';
import 'writing/writing_screen.dart';
import 'word_manager/word_manager_screen.dart';
import 'settings/settings_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  static const _navItems = [
    _NavItem(Icons.auto_stories_rounded, 'Reader'),
    _NavItem(Icons.extension_rounded, 'Learn'),
    _NavItem(Icons.draw_rounded, 'Write'),
    _NavItem(Icons.collections_bookmark_rounded, 'Words'),
  ];

  final List<Widget> _screens = const [
    ReaderScreen(),
    LearningScreen(),
    WritingScreen(),
    WordManagerScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: cs.surface,
          border: Border(
            top: BorderSide(
              color: cs.onSurface.withValues(alpha: 0.06),
            ),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 8,
              vertical: 8,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_navItems.length, (i) {
                final isActive = _currentIndex == i;
                final item = _navItems[i];
                return _buildNavItem(
                  context,
                  icon: item.icon,
                  label: item.label,
                  isActive: isActive,
                  onTap: () => setState(() => _currentIndex = i),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          horizontal: isActive ? 16 : 12,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: isActive
              ? cs.primary.withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: isActive
                  ? cs.primary
                  : cs.onSurface.withValues(alpha: 0.45),
            ),
            if (isActive) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: cs.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  const _NavItem(this.icon, this.label);
}
