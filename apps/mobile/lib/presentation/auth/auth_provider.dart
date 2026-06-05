import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants.dart';
import '../../infrastructure/api_client.dart';

class AuthUser {
  final String id;
  final String email;

  AuthUser({required this.id, required this.email});

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
    );
  }
}

class AuthProvider extends ChangeNotifier {
  String? _token;
  AuthUser? _user;
  bool _isAuthenticated = false;
  bool _isLoading = true;
  String? _error;

  String? get token => _token;
  AuthUser? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AuthProvider() {
    initialize();
  }

  Future<void> initialize() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    // Register callback for API Client unauthorized events
    apiClient.setOnUnauthorized(() {
      logout();
      _error = 'Session expired. Please log in again.';
      notifyListeners();
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString(AppConstants.keyAuthToken);

      if (_token != null) {
        // Verify token with server
        apiClient.setToken(_token);
        final profile = await apiClient.get<Map<String, dynamic>>('/api/auth/me');
        _user = AuthUser.fromJson(profile);
        _isAuthenticated = true;
      }
    } catch (e) {
      _token = null;
      _user = null;
      _isAuthenticated = false;
      apiClient.setToken(null);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.post<Map<String, dynamic>>('/api/auth/login', {
        'email': email,
        'password': password,
      });

      _token = data['accessToken'] as String;
      _user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      _isAuthenticated = true;

      await apiClient.setToken(_token);
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.post<Map<String, dynamic>>('/api/auth/register', {
        'email': email,
        'password': password,
      });

      _token = data['accessToken'] as String;
      _user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      _isAuthenticated = true;

      await apiClient.setToken(_token);
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void logout() {
    _token = null;
    _user = null;
    _isAuthenticated = false;
    _error = null;
    apiClient.setToken(null);
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
