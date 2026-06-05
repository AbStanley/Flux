class AppConstants {
  // Default values
  static const String defaultApiUrl = 'http://10.0.2.2:3000'; // Default for Android emulator
  static const String defaultSourceLanguage = 'Spanish';
  static const String defaultSourceLangCode = 'es';
  static const String defaultTargetLanguage = 'English';
  static const String defaultTargetLangCode = 'en';
  static const String defaultProficiencyLevel = 'B1';
  static const String defaultTheme = 'light';
  static const String defaultLlmModel = 'llama3';

  // Storage Keys
  static const String keyApiUrl = 'flux_api_url';
  static const String keyAuthToken = 'flux_auth_token';
  static const String keySelectedTheme = 'flux_theme';
  static const String keyProficiencyLevel = 'flux_proficiency';
  static const String keySourceLang = 'flux_source_lang';
  static const String keySourceLangCode = 'flux_source_lang_code';
  static const String keyTargetLang = 'flux_target_lang';
  static const String keyTargetLangCode = 'flux_target_lang_code';
  static const String keySelectedModel = 'flux_selected_model';
}
