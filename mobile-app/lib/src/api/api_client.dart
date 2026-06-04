import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/mobile_history.dart';

class ApiClient {
  static const defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.financialku.online/api/v1',
  );
  static const _baseUrlKey = 'apiBaseUrl';
  static const _accessTokenKey = 'accessToken';
  static const _refreshTokenKey = 'refreshToken';
  static const _secureStorage = FlutterSecureStorage();
  static const _requestTimeout = Duration(seconds: 20);
  static const _uploadTimeout = Duration(seconds: 60);

  ApiClient({String? baseUrl}) : _baseUrlOverride = baseUrl;

  final String? _baseUrlOverride;

  Future<String?> get token async {
    final secureToken = await _secureStorage.read(key: _accessTokenKey);
    if (secureToken != null && secureToken.isNotEmpty) {
      return secureToken;
    }

    final prefs = await SharedPreferences.getInstance();
    final legacyToken = prefs.getString(_accessTokenKey);
    final legacyRefresh = prefs.getString(_refreshTokenKey);
    if (legacyToken != null && legacyToken.isNotEmpty) {
      await saveSession(
        accessToken: legacyToken,
        refreshToken: legacyRefresh ?? '',
      );
      await prefs.remove(_accessTokenKey);
      await prefs.remove(_refreshTokenKey);
    }

    return legacyToken;
  }

  Future<String?> get refreshToken async {
    return _secureStorage.read(key: _refreshTokenKey);
  }

  Future<String> get baseUrl async {
    if (_baseUrlOverride != null && _baseUrlOverride.isNotEmpty) {
      return normalizeBaseUrl(_baseUrlOverride);
    }

    final prefs = await SharedPreferences.getInstance();
    return normalizeBaseUrl(prefs.getString(_baseUrlKey) ?? defaultBaseUrl);
  }

  Future<void> saveBaseUrl(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, normalizeBaseUrl(value));
  }

  Future<void> resetBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_baseUrlKey);
  }

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _secureStorage.write(key: _accessTokenKey, value: accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
  }

  Future<void> clearSession() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
  }

  Future<void> logout() async {
    try {
      await post('/auth/logout', {});
    } on ApiException {
      // Local logout must still succeed even when the server is unreachable.
    } finally {
      await clearSession();
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final body = await _postJson(
      '/auth/login',
      {'email': email.trim(), 'password': password},
      authenticated: false,
      retryOnUnauthorized: false,
    );

    final accessToken = body['accessToken']?.toString();
    final refreshToken = body['refreshToken']?.toString();

    if (accessToken != null && refreshToken != null) {
      await saveSession(accessToken: accessToken, refreshToken: refreshToken);
    }

    try {
      await requireEmployeeSession();
    } on ApiException {
      await clearSession();
      rethrow;
    }

    return body;
  }

  Future<void> refreshSession() async {
    final currentRefreshToken = await refreshToken;
    if (currentRefreshToken == null || currentRefreshToken.isEmpty) {
      throw AuthException('Session sudah berakhir.');
    }

    final body = await _postJson(
      '/auth/refresh-token',
      {'refreshToken': currentRefreshToken},
      authenticated: false,
      retryOnUnauthorized: false,
    );

    final accessToken = body['accessToken']?.toString();
    final nextRefreshToken = body['refreshToken']?.toString();

    if (accessToken == null ||
        accessToken.isEmpty ||
        nextRefreshToken == null ||
        nextRefreshToken.isEmpty) {
      throw AuthException('Session sudah berakhir.');
    }

    await saveSession(accessToken: accessToken, refreshToken: nextRefreshToken);
  }

  Future<Map<String, dynamic>> getJson(String path) async {
    final url = await _url(path);
    final response = await _sendWithRefresh(
      () async =>
          http.get(url, headers: await _headers()).timeout(_requestTimeout),
    );

    return _decode(response);
  }

  Future<Map<String, dynamic>> health() {
    return getJson('');
  }

  Future<Map<String, dynamic>> me() {
    return getJson('/mobile/me');
  }

  Future<Map<String, dynamic>> requireEmployeeSession() async {
    final profile = await me();
    final roleName = _roleName(profile);
    final employee = profile['employee'];

    if (roleName != 'EMPLOYEE' || employee == null) {
      throw AuthException('Akun ini bukan employee.');
    }

    return profile;
  }

  Future<MobileHistory> getMobileHistory({int limit = 10}) async {
    final results = await Future.wait([
      getJson('/mobile/attendances?limit=$limit'),
      getJson('/mobile/activities?limit=$limit'),
      getJson('/mobile/leave-requests?limit=$limit'),
    ]);

    return MobileHistory(
      attendances: _items(
        results[0],
      ).map(AttendanceHistoryItem.fromJson).toList(),
      activities: _items(results[1]).map(ActivityHistoryItem.fromJson).toList(),
      leaves: _items(results[2]).map(LeaveHistoryItem.fromJson).toList(),
    );
  }

  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> payload, {
    bool authenticated = true,
  }) async {
    return _postJson(path, payload, authenticated: authenticated);
  }

  Future<Map<String, dynamic>> _postJson(
    String path,
    Map<String, dynamic> payload, {
    bool authenticated = true,
    bool retryOnUnauthorized = true,
  }) async {
    final url = await _url(path);
    final response = await _sendWithRefresh(
      () async => http
          .post(
            url,
            headers: await _headers(authenticated: authenticated),
            body: jsonEncode(payload),
          )
          .timeout(_requestTimeout),
      authenticated: authenticated,
      retryOnUnauthorized: retryOnUnauthorized,
    );

    return _decode(response);
  }

  Future<Map<String, dynamic>> uploadFile({
    required String path,
    required String type,
  }) async {
    final root = await baseUrl;
    final uri = Uri.parse(
      '$root/uploads',
    ).replace(queryParameters: {'type': type});

    final response = await _sendWithRefresh(
      () => _sendMultipart(uri: uri, path: path),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> checkIn({
    required String attendanceDate,
    required double latitude,
    required double longitude,
    required String photoUrl,
    String? assignmentId,
  }) {
    final payload = <String, dynamic>{
      'attendanceDate': attendanceDate,
      'latitude': latitude,
      'longitude': longitude,
      'photoUrl': photoUrl,
    };

    if (assignmentId != null && assignmentId.isNotEmpty) {
      payload['assignmentId'] = assignmentId;
    }

    return post('/attendances/check-in', payload);
  }

  Future<Map<String, dynamic>> checkOut({
    required String attendanceDate,
    required double latitude,
    required double longitude,
    required String photoUrl,
  }) {
    return post('/attendances/check-out', {
      'attendanceDate': attendanceDate,
      'latitude': latitude,
      'longitude': longitude,
      'photoUrl': photoUrl,
    });
  }

  Future<Map<String, dynamic>> createActivity({
    required String activityDate,
    required String title,
    required String description,
    String status = 'DRAFT',
    double? latitude,
    double? longitude,
    List<String> photoUrls = const [],
  }) {
    final payload = <String, dynamic>{
      'activityDate': activityDate,
      'title': title,
      'description': description,
      'status': status,
    };

    if (latitude != null) payload['latitude'] = latitude;
    if (longitude != null) payload['longitude'] = longitude;
    if (photoUrls.isNotEmpty) payload['photoUrls'] = photoUrls;

    return post('/daily-activities', payload);
  }

  Future<Map<String, dynamic>> createLeaveRequest({
    required String type,
    required String startDate,
    required String endDate,
    required String reason,
    String? attachmentUrl,
  }) {
    final payload = <String, dynamic>{
      'type': type,
      'startDate': startDate,
      'endDate': endDate,
      'reason': reason,
    };

    if (attachmentUrl != null && attachmentUrl.isNotEmpty) {
      payload['attachmentUrl'] = attachmentUrl;
    }

    return post('/leave-requests', payload);
  }

  Future<Map<String, String>> _headers({
    bool authenticated = true,
    bool includeContentType = true,
  }) async {
    final headers = <String, String>{'Accept': 'application/json'};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    final accessToken = authenticated ? await token : null;
    if (accessToken != null && accessToken.isNotEmpty) {
      headers['Authorization'] = 'Bearer $accessToken';
    }

    return headers;
  }

  Map<String, dynamic> _decode(http.Response response) {
    final decoded = _decodeBody(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (decoded is Map<String, dynamic>) return decoded;
      return {'data': decoded};
    }

    final message = decoded is Map<String, dynamic>
        ? decoded['message']?.toString() ?? decoded['error']?.toString()
        : null;
    if (response.statusCode == 401 || response.statusCode == 403) {
      throw AuthException(message ?? 'Session sudah berakhir.');
    }
    throw ApiException(message ?? 'Request gagal (${response.statusCode})');
  }

  Object? _decodeBody(String body) {
    if (body.isEmpty) return <String, dynamic>{};

    try {
      return jsonDecode(body) as Object?;
    } on FormatException {
      throw ApiException('Response server tidak valid.');
    }
  }

  List<Map<String, dynamic>> _items(Map<String, dynamic> json) {
    return (json['items'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();
  }

  String? _roleName(Map<String, dynamic> profile) {
    final role = profile['role'];
    if (role is Map<String, dynamic>) {
      return role['name']?.toString().toUpperCase();
    }
    return role?.toString().toUpperCase();
  }

  Future<Uri> _url(String path) async {
    final root = await baseUrl;
    if (path.isEmpty) return Uri.parse(root);
    return Uri.parse('$root$path');
  }

  Future<http.Response> _runRequest(
    Future<http.Response> Function() request,
  ) async {
    try {
      return await request();
    } on TimeoutException {
      throw NetworkException('Koneksi timeout. Cek internet atau server API.');
    } on http.ClientException {
      throw NetworkException('Tidak bisa terhubung ke server API.');
    }
  }

  Future<http.Response> _sendWithRefresh(
    Future<http.Response> Function() request, {
    bool authenticated = true,
    bool retryOnUnauthorized = true,
  }) async {
    final response = await _runRequest(request);

    if (!authenticated || !retryOnUnauthorized || response.statusCode != 401) {
      return response;
    }

    try {
      await refreshSession();
    } on ApiException {
      return response;
    }

    return _runRequest(request);
  }

  Future<http.Response> _sendMultipart({
    required Uri uri,
    required String path,
  }) async {
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll(await _headers(includeContentType: false));
    request.files.add(await http.MultipartFile.fromPath('file', path));

    final streamed = await request.send().timeout(_uploadTimeout);
    return http.Response.fromStream(streamed).timeout(_uploadTimeout);
  }

  static String normalizeBaseUrl(String value) {
    var normalized = value.trim();
    if (normalized.isEmpty) return defaultBaseUrl;
    if (!normalized.startsWith('http://') &&
        !normalized.startsWith('https://')) {
      normalized = 'https://$normalized';
    }
    while (normalized.endsWith('/')) {
      normalized = normalized.substring(0, normalized.length - 1);
    }
    if (!normalized.endsWith('/api/v1')) {
      normalized = '$normalized/api/v1';
    }
    return normalized;
  }
}

class ApiException implements Exception {
  ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class AuthException extends ApiException {
  AuthException(super.message);
}

class NetworkException extends ApiException {
  NetworkException(super.message);
}
