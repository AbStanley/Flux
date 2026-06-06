import 'dart:async';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import '../../domain/llm_types.dart';

/// Dart-side bridge to the native GemmaModelManager.
///
/// Manages downloading, deleting, and querying on-device Gemma models
/// via Platform Channels. All heavy I/O runs in native Kotlin.
class LocalModelManager {
  static const _channel = MethodChannel('com.flux.flux_mobile/gemma');
  static const _events = EventChannel('com.flux.flux_mobile/gemma_events');

  /// Returns the catalog of models that *can* be downloaded.
  Future<List<LocalModelInfo>> listAvailableModels() async {
    try {
      final result = await _channel.invokeMethod<List>('listAvailableModels');
      if (result == null) return [];
      return result
          .cast<Map>()
          .map((m) => LocalModelInfo.fromMap(Map<String, dynamic>.from(m)))
          .toList();
    } on MissingPluginException {
      // Platform channel not registered (e.g. running on desktop/web)
      return _fallbackModels();
    }
  }

  /// Returns only models that are already downloaded on this device.
  Future<List<LocalModelInfo>> listDownloadedModels() async {
    try {
      final result = await _channel.invokeMethod<List>('listDownloadedModels');
      if (result == null) return [];
      return result
          .cast<Map>()
          .map((m) => LocalModelInfo.fromMap(Map<String, dynamic>.from(m)))
          .toList();
    } on MissingPluginException {
      return [];
    }
  }

  /// Starts downloading [modelId] using Dart's HttpClient.
  /// Yields progress updates from 0.0 to 1.0.
  Stream<double> downloadModel(String modelId) async* {
    final available = await listAvailableModels();
    final model = available.firstWhere(
      (m) => m.id == modelId,
      orElse: () => throw Exception('Model $modelId not found in catalog'),
    );

    final urlStr = model.downloadUrl;
    if (urlStr == null || urlStr.isEmpty) {
      throw Exception('Download URL is empty for model: $modelId');
    }

    final tempDir = await getTemporaryDirectory();
    final tempFile = File('${tempDir.path}/${model.id}_download.tmp');
    if (await tempFile.exists()) {
      await tempFile.delete();
    }

    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 30);

    try {
      final request = await client.getUrl(Uri.parse(urlStr));
      request.headers.add('User-Agent', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36');
      final response = await request.close();

      if (response.statusCode != 200) {
        throw HttpException('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }

      final totalBytes = response.contentLength > 0 ? response.contentLength : model.sizeBytes;
      var downloadedBytes = 0;
      final sink = tempFile.openWrite();

      try {
        await for (final chunk in response) {
          sink.add(chunk);
          downloadedBytes += chunk.length;
          yield (downloadedBytes / totalBytes).clamp(0.0, 1.0);
        }
        await sink.close();
      } catch (e) {
        await sink.close();
        rethrow;
      }

      final importSuccess = await importModelFile(modelId, tempFile.path);
      if (!importSuccess) {
        throw Exception('Native import failed for model file: $modelId');
      }
    } catch (e) {
      if (await tempFile.exists()) {
        await tempFile.delete();
      }
      rethrow;
    } finally {
      client.close();
    }
  }

  /// Deletes a previously downloaded model from device storage.
  Future<void> deleteModel(String modelId) async {
    await _channel.invokeMethod<void>('deleteModel', {'modelId': modelId});
  }

  /// Loads a downloaded model into memory for inference.
  Future<void> loadModel(String modelId) async {
    await _channel.invokeMethod<void>('loadModel', {'modelId': modelId});
  }

  /// Imports a manually downloaded .litertlm file into the app's catalog.
  Future<bool> importModelFile(String modelId, String filePath) async {
    try {
      final success = await _channel.invokeMethod<bool>('importModelFile', {
        'modelId': modelId,
        'filePath': filePath,
      });
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Unloads the active model to free RAM.
  Future<void> unloadModel() async {
    await _channel.invokeMethod<void>('unloadModel');
  }

  /// Whether a model is currently loaded and ready for inference.
  Future<bool> isModelLoaded() async {
    try {
      return await _channel.invokeMethod<bool>('isModelLoaded') ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Static catalog when native side isn't available (dev/testing).
  List<LocalModelInfo> _fallbackModels() => [
        LocalModelInfo(
          id: 'gemma-4-e2b',
          displayName: 'Gemma 4 E2B (2B)',
          parameterCount: '2B',
          sizeBytes: 2588147712, // ~2.4 GB
        ),
        LocalModelInfo(
          id: 'gemma-4-e4b',
          displayName: 'Gemma 4 E4B (4B)',
          parameterCount: '4B',
          sizeBytes: 3659530240, // ~3.4 GB
        ),
      ];
}

/// Singleton — one manager per app lifecycle.
final localModelManager = LocalModelManager();
