/// Inference source: server (Ollama via NestJS) or on-device (LiteRT-LM).
enum LlmMode { server, local }

/// Download lifecycle for an on-device model asset.
enum ModelDownloadStatus { notDownloaded, downloading, downloaded }

/// Metadata for a downloadable on-device model.
class LocalModelInfo {
  final String id;
  final String displayName;
  final String parameterCount;
  final int sizeBytes;
  final String? downloadUrl;
  bool isDownloaded;
  double downloadProgress;

  LocalModelInfo({
    required this.id,
    required this.displayName,
    required this.parameterCount,
    required this.sizeBytes,
    this.downloadUrl,
    this.isDownloaded = false,
    this.downloadProgress = 0.0,
  });

  factory LocalModelInfo.fromMap(Map<String, dynamic> map) {
    return LocalModelInfo(
      id: map['id'] as String,
      displayName: map['displayName'] as String,
      parameterCount: map['parameterCount'] as String,
      sizeBytes: map['sizeBytes'] as int,
      downloadUrl: map['downloadUrl'] as String?,
      isDownloaded: (map['isDownloaded'] ?? false) as bool,
    );
  }

  String get formattedSize {
    final gb = sizeBytes / (1024 * 1024 * 1024);
    return '${gb.toStringAsFixed(1)} GB';
  }

  ModelDownloadStatus get status {
    if (isDownloaded) return ModelDownloadStatus.downloaded;
    if (downloadProgress > 0 && downloadProgress < 1.0) {
      return ModelDownloadStatus.downloading;
    }
    return ModelDownloadStatus.notDownloaded;
  }
}
