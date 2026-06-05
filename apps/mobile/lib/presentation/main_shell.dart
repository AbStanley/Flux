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

  final List<Widget> _screens = [
    const ReaderScreen(),
    const LearningScreen(),
    const WritingScreen(),
    const WordManagerScreen(),
  ];

  final List<String> _titles = [
    'Smart Reader',
    'Learning Mode',
    'Interactive Writing',
    'Word Manager',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _titles[_currentIndex],
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.menu_book),
            label: 'Reader',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.sports_esports),
            label: 'Learning',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.edit_note),
            label: 'Writing',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bookmark),
            label: 'Words',
          ),
        ],
      ),
    );
  }
}
