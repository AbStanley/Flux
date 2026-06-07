import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../domain/llm_types.dart';
import 'llm_strategy.dart';
import 'local_llm_strategy.dart';
import 'local_model_manager.dart';
import 'server_llm_strategy.dart';

/// Facade that delegates to the active LLM strategy with automatic offline fallback.
class LlmService {
  final ServerLlmStrategy _server = ServerLlmStrategy();
  final LocalLlmStrategy _local = LocalLlmStrategy();
  LlmMode _mode = LlmMode.server;

  LlmMode get mode => _mode;
  ILlmStrategy get activeStrategy =>
      _mode == LlmMode.server ? _server : _local;

  void setMode(LlmMode mode) => _mode = mode;

  Future<Map<String, dynamic>> generate(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    if (_mode == LlmMode.server) {
      try {
        return await _server.generate(endpoint, body);
      } catch (e) {
        if (await _isLocalModelDownloaded()) {
          debugPrint("Server generation failed ($e), falling back to local model.");
          return await _local.generate(endpoint, body);
        }
        rethrow;
      }
    } else {
      return await _local.generate(endpoint, body);
    }
  }

  Future<void> stream(
    String endpoint,
    Map<String, dynamic> body,
    void Function(Map<String, dynamic> chunk) onChunk,
  ) async {
    if (_mode == LlmMode.server) {
      try {
        await _server.stream(endpoint, body, onChunk);
      } catch (e) {
        if (await _isLocalModelDownloaded()) {
          debugPrint("Server stream failed ($e), falling back to local model.");
          await _local.stream(endpoint, body, onChunk);
        } else {
          rethrow;
        }
      }
    } else {
      await _local.stream(endpoint, body, onChunk);
    }
  }

  Future<bool> isAvailable() => activeStrategy.isAvailable();

  /// Cancel ongoing inference on the active strategy.
  Future<void> cancelGeneration() async {
    await activeStrategy.cancelGeneration();
  }

  Future<bool> _isLocalModelDownloaded() async {
    try {
      final downloaded = await localModelManager.listDownloadedModels();
      return downloaded.isNotEmpty;
    } catch (_) {
      return false;
    }
  }
}

/// Singleton — one service per app lifecycle.
final llmService = LlmService();
