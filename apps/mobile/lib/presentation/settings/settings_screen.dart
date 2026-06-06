import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import 'inference_source_card.dart';
import 'settings_data.dart';
import 'settings_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _apiUrlController;
  bool? _lastTestResult;

  @override
  void initState() {
    super.initState();
    final s = Provider.of<SettingsProvider>(context, listen: false);
    _apiUrlController = TextEditingController(text: s.apiUrl);
  }

  @override
  void dispose() { _apiUrlController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final s = Provider.of<SettingsProvider>(context);
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          InferenceSourceCard(settings: s),
          const SizedBox(height: 16),
          _card(cs, tt, Icons.wifi_rounded, 'Connection', [
            TextField(
              controller: _apiUrlController,
              decoration: const InputDecoration(
                labelText: 'NestJS Server Address',
                hintText: 'e.g. http://10.0.2.2:3000',
              ),
              onChanged: (v) => s.updateApiUrl(v.trim()),
            ),
            const SizedBox(height: 12),
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: _lastTestResult == true
                    ? Border.all(color: Colors.green, width: 1.5) : null,
              ),
              child: ElevatedButton.icon(
                icon: Icon(_lastTestResult == true
                    ? Icons.check_circle_outline : Icons.network_check),
                label: const Text('Test Connection'),
                onPressed: () => _testConnection(s),
              ),
            ),
          ]),
          const SizedBox(height: 16),
          _card(cs, tt, Icons.palette_rounded, 'Appearance', [
            DropdownButtonFormField<AppThemeMode>(
              value: s.themeMode,
              decoration: const InputDecoration(labelText: 'App Theme'),
              items: AppThemeMode.values.map((m) => DropdownMenuItem(
                value: m,
                child: Row(children: [
                  Container(width: 14, height: 14, decoration: BoxDecoration(
                    color: kThemeSwatches[m], shape: BoxShape.circle)),
                  const SizedBox(width: 10),
                  Text(m.name[0].toUpperCase() + m.name.substring(1)),
                ]),
              )).toList(),
              onChanged: (m) { if (m != null) s.updateTheme(m); },
            ),
          ]),
          const SizedBox(height: 16),
          _card(cs, tt, Icons.auto_awesome_rounded, 'AI & Languages', [
            _langDropdown('Source Language (Native)', s.sourceLanguage,
                (l) => _updateLang(s, source: l)),
            const SizedBox(height: 12),
            _langDropdown('Target Language (Learning)', s.targetLanguage,
                (l) => _updateLang(s, target: l)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: s.proficiencyLevel,
              decoration: const InputDecoration(labelText: 'CEFR Level'),
              items: ['A1','A2','B1','B2','C1','C2']
                  .map((l) => DropdownMenuItem(value: l, child: Text(l)))
                  .toList(),
              onChanged: (l) { if (l != null) s.updateProficiencyLevel(l); },
            ),
            const SizedBox(height: 12),
            // Server model selector (only visible in server mode)
            if (!s.isLocalMode) ...[
              if (s.availableModels.isNotEmpty)
                DropdownButtonFormField<String>(
                  value: s.selectedModel,
                  decoration: const InputDecoration(labelText: 'Server LLM Model'),
                  items: s.availableModels
                      .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                      .toList(),
                  onChanged: (m) { if (m != null) s.updateSelectedModel(m); },
                )
              else _warningTile(cs, tt,
                  'No server models detected. Ensure Ollama and the backend '
                  'are running.'),
            ],
          ]),
        ],
      ),
    );
  }

  Widget _card(ColorScheme cs, TextTheme tt, IconData icon, String title,
      List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              Icon(icon, size: 20, color: cs.primary),
              const SizedBox(width: 8),
              Text(title, style: tt.titleMedium?.copyWith(color: cs.primary)),
            ]),
            const SizedBox(height: 14),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _langDropdown(String label, String value,
      ValueChanged<String?> onChanged) {
    final muted = Theme.of(context).colorScheme.onSurface.withValues(alpha: .4);
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(labelText: label),
      items: kLanguages.map((l) => DropdownMenuItem(
        value: l.name,
        child: Row(children: [
          Text(l.flag, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 8), Text(l.name),
          const SizedBox(width: 6),
          Text(l.code, style: TextStyle(color: muted, fontSize: 12)),
        ]),
      )).toList(),
      onChanged: onChanged,
    );
  }

  Widget _warningTile(ColorScheme cs, TextTheme tt, String msg) => Card(
    color: cs.error.withValues(alpha: 0.08),
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Icon(Icons.warning_amber_rounded, color: cs.error, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(msg,
            style: tt.bodySmall?.copyWith(color: cs.error))),
      ]),
    ),
  );

  void _updateLang(SettingsProvider s, {String? source, String? target}) {
    final src = source ?? s.sourceLanguage;
    final tgt = target ?? s.targetLanguage;
    s.updateLanguages(
      source: src, sourceCode: codeFor(src),
      target: tgt, targetCode: codeFor(tgt),
    );
  }

  Future<void> _testConnection(SettingsProvider settings) async {
    showDialog(
      context: context, barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    final ok = await settings.testConnection();
    if (context.mounted) {
      Navigator.pop(context);
      setState(() => _lastTestResult = ok);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok
            ? 'Connection Successful! Models loaded.'
            : 'Connection Failed. Check host IP and network.'),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ));
    }
  }
}
