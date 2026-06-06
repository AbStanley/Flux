import '../../domain/llm_types.dart';
import 'llm_strategy.dart';
import 'local_llm_strategy.dart';
import 'server_llm_strategy.dart';

/// Facade that delegates to the active LLM strategy.
///
/// Consumers call `llmService.generate(...)` or `llmService.stream(...)`
/// without knowing whether inference runs on the backend or on-device.
/// Switch the active mode via [setMode].
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
  ) =>
      activeStrategy.generate(endpoint, body);

  Future<void> stream(
    String endpoint,
    Map<String, dynamic> body,
    void Function(Map<String, dynamic> chunk) onChunk,
  ) =>
      activeStrategy.stream(endpoint, body, onChunk);

  Future<bool> isAvailable() => activeStrategy.isAvailable();

  /// Cancel local inference (no-op for server strategy).
  Future<void> cancelGeneration() async {
    if (_mode == LlmMode.local) {
      await _local.cancelGeneration();
    }
  }
}

/// Singleton — one service per app lifecycle.
final llmService = LlmService();
