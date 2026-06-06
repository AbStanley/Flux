import 'dart:async';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'llm_strategy.dart';
import 'local_model_manager.dart';

/// Routes LLM requests to the on-device Gemma model via Platform Channels.
///
/// The heavy lifting (LiteRT-LM) runs in native Kotlin. This class
/// translates the ILlmStrategy contract into MethodChannel/EventChannel
/// calls and reconstructs the same `Map<String, dynamic>` chunks that
/// the server strategy would produce, so callers see no difference.
class LocalLlmStrategy implements ILlmStrategy {
  static const _channel = MethodChannel('com.flux.flux_mobile/gemma');
  static const _events = EventChannel('com.flux.flux_mobile/gemma_events');

  @override
  Future<Map<String, dynamic>> generate(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    await _ensureModelLoaded();
    final prompt = _buildPrompt(endpoint, body);
    final result = await _channel.invokeMethod<String>('generate', {
      'prompt': prompt,
    });
    return _wrapResponse(endpoint, result ?? '');
  }

  @override
  Future<void> stream(
    String endpoint,
    Map<String, dynamic> body,
    void Function(Map<String, dynamic> chunk) onChunk,
  ) async {
    await _ensureModelLoaded();
    final prompt = _buildPrompt(endpoint, body);
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

  /// Converts API-style endpoint + body into a plain text prompt
  /// suitable for on-device inference (no server routing needed).
  String _buildPrompt(String endpoint, Map<String, dynamic> body) {
    if (endpoint.contains('generate-content')) {
      return _buildContentPrompt(body);
    }
    if (endpoint.contains('translate') ||
        endpoint.contains('rich-translation')) {
      return _buildTranslationPrompt(body);
    }
    if (endpoint.contains('check-writing')) {
      return _buildWritingCheckPrompt(body);
    }
    if (endpoint.contains('generate-game-content')) {
      return _buildGamePrompt(body);
    }
    // Fallback: send raw text
    return body['text'] as String? ?? body.toString();
  }

  String _buildContentPrompt(Map<String, dynamic> b) {
    final topic = b['topic'] ?? 'general';
    final lang = b['sourceLanguage'] ?? 'English';
    final level = b['proficiencyLevel'] ?? 'B1';
    final type = b['contentType'] ?? 'story';
    return 'Write a $type in $lang about "$topic" for a $level level language learner. Keep it engaging and natural.';
  }

  String _buildTranslationPrompt(Map<String, dynamic> b) {
    final text = b['text'] ?? '';
    final target = b['targetLanguage'] ?? 'English';
    final ctx = b['context'] ?? '';
    return 'Translate "$text" to $target. ${ctx.toString().isNotEmpty ? "Context: $ctx. " : ""}'
        'Return JSON: {"translation":"...","segment":"$text",'
        '"grammar":{"partOfSpeech":"...","explanation":"..."},'
        '"examples":[{"sentence":"...","translation":"..."}],'
        '"alternatives":["..."]}';
  }

  String _buildWritingCheckPrompt(Map<String, dynamic> b) {
    final text = b['text'] ?? '';
    final lang = b['sourceLanguage'] ?? 'the target language';
    return 'Check this $lang text for errors: "$text". Return JSON: {"corrections":[{"type":"grammar",'
        '"shortDescription":"...","longDescription":"...","startIndex":0,"endIndex":5,"mistakeText":"...","correctionText":"..."}]}';
  }

  String _buildGamePrompt(Map<String, dynamic> b) {
    final topic = b['topic'] ?? 'General Vocabulary';
    final level = b['level'] ?? 'B1';
    final src = b['sourceLanguage'] ?? 'English';
    final tgt = b['targetLanguage'] ?? 'Spanish';
    return 'Generate 8 vocabulary quiz questions about "$topic" from $src to $tgt at $level level. '
        'Return a JSON array: [{"question":"word in $tgt","answer":"translation in $src","choices":["opt1","opt2","opt3","opt4"]}]';
  }

  /// Wraps raw model output into the same shape the server returns,
  /// so callers don't need endpoint-specific handling.
  Map<String, dynamic> _wrapResponse(String endpoint, String raw) {
    if (endpoint.contains('translate') ||
        endpoint.contains('rich-translation') ||
        endpoint.contains('check-writing') ||
        endpoint.contains('generate-game-content')) {
      // Attempt to parse JSON from model output
      return _tryParseJson(raw);
    }
    return {'response': raw};
  }

  Map<String, dynamic> _tryParseJson(String raw) {
    try {
      // Strip markdown code fences if present
      var cleaned = raw.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replaceFirst(RegExp(r'^```\w*\n?'), '');
        cleaned = cleaned.replaceFirst(RegExp(r'\n?```$'), '');
      }
      // Use dart:convert inline to avoid import at top of strategy
      return Map<String, dynamic>.from(
        jsonDecode(cleaned.trim()),
      );
    } catch (_) {
      return {'response': raw};
    }
  }
}
