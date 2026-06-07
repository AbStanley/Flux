import 'dart:async';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/text_utils.dart';
import 'llm_strategy.dart';
import 'local_llm_prompt_builder.dart';
import 'local_model_manager.dart';

/// Routes LLM requests to the on-device Gemma model via Platform Channels.
class LocalLlmStrategy implements ILlmStrategy {
  static const _channel = MethodChannel('com.flux.flux_mobile/gemma');
  static const _events = EventChannel('com.flux.flux_mobile/gemma_events');

  @override
  Future<Map<String, dynamic>> generate(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    await _ensureModelLoaded();
    final prompt = LocalLlmPromptBuilder.buildPrompt(endpoint, body);
    final result = await _channel.invokeMethod<String>('generate', {
      'prompt': prompt,
    });
    
    // Clean raw result first to strip thinking, code blocks, and markdown markers.
    final isMultiline = endpoint.contains('generate-content') || endpoint.contains('generate-game-content');
    final cleaned = TextUtils.cleanResponse(result ?? '', multiline: isMultiline);
    
    return _wrapResponse(endpoint, cleaned);
  }

  @override
  Future<void> stream(
    String endpoint,
    Map<String, dynamic> body,
    void Function(Map<String, dynamic> chunk) onChunk,
  ) async {
    await _ensureModelLoaded();
    final prompt = LocalLlmPromptBuilder.buildPrompt(endpoint, body);
    final completer = Completer<void>();

    // Start streaming on the native side
    await _channel.invokeMethod<void>('generateStream', {
      'prompt': prompt,
    });

    final subscription = _events.receiveBroadcastStream().listen(
      (event) {
        if (event is! Map) return;
        final map = Map<String, dynamic>.from(event);
        final type = map['type'] as String?;

        if (type == 'token') {
          // Mirror the server's NDJSON chunk format
          onChunk({'response': map['content'] ?? ''});
        } else if (type == 'done') {
          if (!completer.isCompleted) completer.complete();
        } else if (type == 'error') {
          if (!completer.isCompleted) {
            completer.completeError(
              Exception(map['message'] ?? 'Local inference error'),
            );
          }
        }
      },
      onError: (error) {
        if (!completer.isCompleted) completer.completeError(error);
      },
      onDone: () {
        if (!completer.isCompleted) completer.complete();
      },
    );

    try {
      await completer.future;
    } finally {
      await subscription.cancel();
    }
  }

  @override
  Future<bool> isAvailable() async {
    try {
      return await _channel.invokeMethod<bool>('isModelLoaded') ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Cancels an in-progress generation on the native side.
  @override
  Future<void> cancelGeneration() async {
    await _channel.invokeMethod<void>('cancelGeneration');
  }

  Future<void> _ensureModelLoaded() async {
    if (!await isAvailable()) {
      final prefs = await SharedPreferences.getInstance();
      final modelId = prefs.getString('flux_selected_local_model') ?? 'gemma-4-e2b';
      await localModelManager.loadModel(modelId);
    }
  }

  /// Wraps raw model output into the same shape the server returns,
  /// so callers don't need endpoint-specific handling.
  Map<String, dynamic> _wrapResponse(String endpoint, String raw) {
    if (endpoint.contains('translate') ||
        endpoint.contains('rich-translation') ||
        endpoint.contains('check-writing') ||
        endpoint.contains('generate-game-content')) {
      // Attempt to parse JSON from model output
      final parsed = _tryParseJson(raw);
      if (endpoint.contains('translate') && !parsed.containsKey('response') && parsed.containsKey('translation')) {
        parsed['response'] = parsed['translation'];
      }
      return parsed;
    }
    return {'response': raw};
  }

  Map<String, dynamic> _tryParseJson(String raw) {
    try {
      var cleaned = raw.trim();

      // Extract JSON structure if wrapped in other text (handles arrays or objects)
      final startObject = cleaned.indexOf('{');
      final startArray = cleaned.indexOf('[');

      int startIndex = -1;
      int endIndex = -1;

      if (startObject != -1 && (startArray == -1 || startObject < startArray)) {
        startIndex = startObject;
        endIndex = cleaned.lastIndexOf('}');
      } else if (startArray != -1) {
        startIndex = startArray;
        endIndex = cleaned.lastIndexOf(']');
      }

      if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
        cleaned = cleaned.substring(startIndex, endIndex + 1);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replaceFirst(RegExp(r'^```\w*\n?'), '');
        cleaned = cleaned.replaceFirst(RegExp(r'\n?```$'), '');
      }

      final decoded = jsonDecode(cleaned.trim());
      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      } else if (decoded is List) {
        return {'response': decoded};
      }
      return {'response': decoded};
    } catch (_) {
      return {'response': raw};
    }
  }
}
