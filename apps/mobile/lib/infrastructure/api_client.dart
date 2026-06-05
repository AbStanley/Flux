import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';

class ApiClient {
  String _baseUrl = AppConstants.defaultApiUrl;
  String? _token;
  void Function()? _onUnauthorized;

  ApiClient() {
    _loadSettings();
  }

  String get baseUrl => _baseUrl;
  String? get token => _token;

  void setOnUnauthorized(void Function() callback) {
    _onUnauthorized = callback;
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString(AppConstants.keyApiUrl) ?? AppConstants.defaultApiUrl;
    _token = prefs.getString(AppConstants.keyAuthToken);
  }

  Future<void> updateBaseUrl(String url) async {
    _baseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyApiUrl, url);
  }

  Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null) {
      await prefs.remove(AppConstants.keyAuthToken);
    } else {
      await prefs.setString(AppConstants.keyAuthToken, token);
    }
  }

  Map<String, String> _headers() {
    return {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
  }

  Future<T> get<T>(String endpoint, {Map<String, String>? query}) async {
    final uri = Uri.parse('$_baseUrl$endpoint').replace(queryParameters: query);
    final response = await http.get(uri, headers: _headers());
    return _handleResponse<T>(response);
  }

  Future<T> post<T>(String endpoint, dynamic body) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final response = await http.post(
      uri,
      headers: _headers(),
      body: jsonEncode(body),
    );
    return _handleResponse<T>(response);
  }

  Future<T> patch<T>(String endpoint, dynamic body) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final response = await http.patch(
      uri,
      headers: _headers(),
      body: jsonEncode(body),
    );
    return _handleResponse<T>(response);
  }

  Future<T> delete<T>(String endpoint) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final response = await http.delete(uri, headers: _headers());
    return _handleResponse<T>(response);
  }

  Future<void> stream(
    String endpoint,
    dynamic body,
    Function(Map<String, dynamic> chunk) onChunk,
  ) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final client = http.Client();
    try {
      final request = http.Request('POST', uri)
        ..headers.addAll(_headers())
        ..body = jsonEncode(body);

      final response = await client.send(request);

      if (response.statusCode == 401) {
        _handleUnauthorized();
        throw Exception('Unauthorized');
      }

      if (response.statusCode >= 400) {
        throw Exception('Stream error: ${response.statusCode}');
      }

      await response.stream
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .forEach((line) {
        if (line.trim().isNotEmpty) {
          try {
            final decoded = jsonDecode(line) as Map<String, dynamic>;
            onChunk(decoded);
          } catch (_) {
            // Ignore malformed lines in stream
          }
        }
      });
    } finally {
      client.close();
    }
  }

  T _handleResponse<T>(http.Response response) {
    if (response.statusCode == 401) {
      _handleUnauthorized();
      throw Exception('Session expired. Please log in again.');
    }

    if (response.statusCode >= 400) {
      String message = response.reasonPhrase ?? 'Network Error';
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map && decoded.containsKey('message')) {
          message = decoded['message'] is List
              ? decoded['message'].first
              : decoded['message'];
        }
      } catch (_) {}
      throw Exception(message);
    }

    if (response.statusCode == 204 || response.body.isEmpty) {
      return {} as T;
    }

    final contentType = response.headers['content-type'];
    if (contentType != null && contentType.contains('application/json')) {
      return jsonDecode(response.body) as T;
    }

    return response.body as T;
  }

  void _handleUnauthorized() {
    setToken(null);
    if (_onUnauthorized != null) {
      _onUnauthorized!();
    }
  }
}

final apiClient = ApiClient();
