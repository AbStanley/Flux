import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import 'settings_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _apiUrlController;

  @override
  void initState() {
    super.initState();
    final settings = Provider.of<SettingsProvider>(context, listen: false);
    _apiUrlController = TextEditingController(text: settings.apiUrl);
  }

  @override
  void dispose() {
    _apiUrlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSectionHeader('Connection'),
          TextField(
            controller: _apiUrlController,
            decoration: const InputDecoration(
              labelText: 'NestJS Server Address',
              hintText: 'e.g. http://10.0.2.2:3000',
            ),
            onChanged: (val) => settings.updateApiUrl(val.trim()),
          ),
          const SizedBox(height: 8),
          ElevatedButton.icon(
            icon: const Icon(Icons.network_check),
            label: const Text('Test Connection'),
            onPressed: () async {
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) => const Center(child: CircularProgressIndicator()),
              );

              final ok = await settings.testConnection();

              if (context.mounted) {
                Navigator.pop(context); // Close loading indicator
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok
                        ? 'Connection Successful! Models loaded.'
                        : 'Connection Failed. Check host IP and network.'),
                    backgroundColor: ok ? Colors.green : Colors.redAccent,
                  ),
                );
              }
            },
          ),
          const SizedBox(height: 16),
          _buildSectionHeader('Appearance & Theme'),
          DropdownButtonFormField<AppThemeMode>(
            value: settings.themeMode,
            decoration: const InputDecoration(labelText: 'App Theme'),
            items: AppThemeMode.values.map((mode) {
              return DropdownMenuItem(
                value: mode,
                child: Text(mode.name.toUpperCase()),
              );
            }).toList(),
            onChanged: (mode) {
              if (mode != null) settings.updateTheme(mode);
            },
          ),
          const SizedBox(height: 16),
          _buildSectionHeader('AI & Language Configuration'),
          DropdownButtonFormField<String>(
            value: settings.proficiencyLevel,
            decoration: const InputDecoration(labelText: 'CEFR Level'),
            items: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) {
              return DropdownMenuItem(value: lvl, child: Text(lvl));
            }).toList(),
            onChanged: (lvl) {
              if (lvl != null) settings.updateProficiencyLevel(lvl);
            },
          ),
          const SizedBox(height: 16),
          if (settings.availableModels.isNotEmpty)
            DropdownButtonFormField<String>(
              value: settings.selectedModel,
              decoration: const InputDecoration(labelText: 'LLM Model'),
              items: settings.availableModels.map((model) {
                return DropdownMenuItem(value: model, child: Text(model));
              }).toList(),
              onChanged: (model) {
                if (model != null) settings.updateSelectedModel(model);
              },
            )
          else
            const Card(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  'No local models detected. Make sure Ollama and the backend are running.',
                  style: TextStyle(fontStyle: FontStyle.italic),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).primaryColor,
        ),
      ),
    );
  }
}
