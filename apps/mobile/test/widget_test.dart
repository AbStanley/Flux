// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:flux_mobile/main.dart';
import 'package:flux_mobile/presentation/auth/auth_provider.dart';
import 'package:flux_mobile/presentation/settings/settings_provider.dart';
import 'package:flux_mobile/presentation/reader/reader_provider.dart';
import 'package:flux_mobile/presentation/word_manager/words_provider.dart';
import 'package:flux_mobile/presentation/learning/learning_provider.dart';
import 'package:flux_mobile/presentation/writing/writing_provider.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
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

    // Verify that the login title or loading indicator is found
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
