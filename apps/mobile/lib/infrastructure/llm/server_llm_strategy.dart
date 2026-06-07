import 'dart:async';
import 'package:http/http.dart' as http;
import '../api_client.dart';
import 'llm_strategy.dart';

/// Routes LLM requests to the NestJS backend (which proxies to Ollama).
class ServerLlmStrategy implements ILlmStrategy {
  http.Client? _activeClient;

  @override
  Future<Map<String, dynamic>> generate(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    cancelGeneration();
    final client = http.Client();
    _activeClient = client;
    try {
      return await apiClient
          .post<Map<String, dynamic>>(endpoint, body, client: client)
          .timeout(const Duration(seconds: 7));
    } finally {
      if (_activeClient == client) {
        _activeClient = null;
      }
    }
  }

  @override
  Future<void> stream(
    String endpoint,
    Map<String, dynamic> body,
    void Function(Map<String, dynamic> chunk) onChunk,
  ) async {
    cancelGeneration();
    final client = http.Client();
    _activeClient = client;
    try {
      await apiClient
          .stream(endpoint, body, onChunk, client: client)
          .timeout(const Duration(seconds: 7));
    } finally {
      if (_activeClient == client) {
        _activeClient = null;
      }
    }
  }

  @override
  Future<bool> isAvailable() async {
    try {
      final data = await apiClient
          .get<Map<String, dynamic>>('/api/tags')
          .timeout(const Duration(seconds: 5));
      return data.containsKey('models');
    } catch (_) {
      return false;
    }
  }

  @override
  Future<void> cancelGeneration() async {
    _activeClient?.close();
    _activeClient = null;
  }
}
