import '../api_client.dart';
import 'llm_strategy.dart';

/// Routes LLM requests to the NestJS backend (which proxies to Ollama).
///
/// This is the existing behaviour — all inference goes through HTTP.
class ServerLlmStrategy implements ILlmStrategy {
  @override
  Future<Map<String, dynamic>> generate(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    return apiClient.post<Map<String, dynamic>>(endpoint, body);
  }

  @override
  Future<void> stream(
    String endpoint,
    Map<String, dynamic> body,
    void Function(Map<String, dynamic> chunk) onChunk,
  ) async {
    await apiClient.stream(endpoint, body, onChunk);
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
}
