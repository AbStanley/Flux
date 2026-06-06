import '../../infrastructure/tts_service.dart';
import 'reader_provider.dart';

class ReaderTtsController {
  final ReaderProvider _provider;

  bool _isPlaying = false;
  int? _currentAudioTokenIndex;
  double _playbackRate = 1.0;

  ReaderTtsController(this._provider);

  bool get isPlaying => _isPlaying;
  int? get currentAudioTokenIndex => _currentAudioTokenIndex;
  double get playbackRate => _playbackRate;

  Future<void> setPlaybackRate(double rate) async {
    _playbackRate = rate;
    await ttsService.setSpeechRate(rate);
    _provider.notify();
  }

  Future<void> play() async {
    if (_provider.tokens.isEmpty) return;
    int startTokenIndex = (_provider.currentPage - 1) * _provider.pageSize;

    if (_currentAudioTokenIndex != null &&
        _currentAudioTokenIndex! >= startTokenIndex &&
        _currentAudioTokenIndex! < startTokenIndex + _provider.pageSize) {
      startTokenIndex = _currentAudioTokenIndex!;
    }

    final String textToPlay = _provider.tokens.sublist(startTokenIndex).join('');
    final int baseOffset = _provider.tokenOffsets[startTokenIndex];

    _isPlaying = true;
    _provider.notify();

    await ttsService.speak(
      textToPlay,
      onProgress: (startChar, endChar) {
        final absoluteChar = baseOffset + startChar;
        int foundTokenIdx = startTokenIndex;
        for (int i = _provider.tokenOffsets.length - 1; i >= startTokenIndex; i--) {
          if (_provider.tokenOffsets[i] <= absoluteChar) {
            foundTokenIdx = i;
            break;
          }
        }
        _currentAudioTokenIndex = foundTokenIdx;
        _provider.notify();
      },
      onComplete: () {
        _isPlaying = false;
        _currentAudioTokenIndex = null;
        _provider.notify();
      },
    );
  }

  Future<void> pause() async {
    await ttsService.pause();
    _isPlaying = false;
    _provider.notify();
  }

  Future<void> stop() async {
    await ttsService.stop();
    _isPlaying = false;
    _currentAudioTokenIndex = null;
    _provider.notify();
  }

  Future<void> speakWord(String word) async {
    await ttsService.speak(
      word,
      onProgress: (start, end) {},
      onComplete: () {},
    );
  }
}
