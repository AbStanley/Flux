/// Strategy interface for LLM inference.
///
/// Implementations swap between server-hosted (Ollama) and on-device
/// (LiteRT-LM) without any consuming code needing to change.
abstract class ILlmStrategy {
  /// Generate a full response (non-streaming).
  Future<Map<String, dynamic>> generate(
    String endpoint,
    Map<String, dynamic> body,
  );

  /// Stream a response token-by-token.
  Future<void> stream(
    String endpoint,
    Map<String, dynamic> body,
    void Function(Map<String, dynamic> chunk) onChunk,
  );

  /// Whether this strategy is currently usable.
  Future<bool> isAvailable();
}
