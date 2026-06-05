import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'presentation/auth/auth_provider.dart';
import 'presentation/auth/login_screen.dart';
import 'presentation/learning/learning_provider.dart';
import 'presentation/main_shell.dart';
import 'presentation/reader/reader_provider.dart';
import 'presentation/settings/settings_provider.dart';
import 'presentation/word_manager/words_provider.dart';
import 'presentation/writing/writing_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ReaderProvider()),
        ChangeNotifierProvider(create: (_) => WordsProvider()),
        ChangeNotifierProvider(create: (_) => LearningProvider()),
        ChangeNotifierProvider(create: (_) => WritingProvider()),
      ],
      child: const FluxApp(),
    ),
  );
}

class FluxApp extends StatelessWidget {
  const FluxApp({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsProvider>(context);
    final auth = Provider.of<AuthProvider>(context);

    Widget homeWidget;
    if (auth.isLoading) {
      homeWidget = const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    } else if (auth.isAuthenticated) {
      homeWidget = const MainShell();
    } else {
      homeWidget = const LoginScreen();
    }

    return MaterialApp(
      title: 'Flux Learning Assistant',
      theme: AppTheme.getTheme(settings.themeMode),
      home: homeWidget,
      debugShowCheckedModeBanner: false,
    );
  }
}
