import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';

class PendingSubmissionService {
  static const _storageKey = 'pendingSubmissions';

  Future<List<PendingSubmission>> list() async {
    final prefs = await SharedPreferences.getInstance();
    final rawItems = prefs.getStringList(_storageKey) ?? [];

    return rawItems
        .map(_decode)
        .whereType<PendingSubmission>()
        .toList(growable: false);
  }

  Future<int> count() async {
    return (await list()).length;
  }

  Future<void> addActivity({
    required String activityDate,
    required String title,
    required String description,
    required String status,
    double? latitude,
    double? longitude,
    String? photoPath,
  }) {
    return _add(
      PendingSubmission(
        id: _id(),
        type: PendingSubmissionType.activity,
        createdAt: DateTime.now(),
        payload: {
          'activityDate': activityDate,
          'title': title,
          'description': description,
          'status': status,
          'latitude': ?latitude,
          'longitude': ?longitude,
          if (photoPath != null && photoPath.isNotEmpty) 'photoPath': photoPath,
        },
      ),
    );
  }

  Future<void> addLeave({
    required String type,
    required String startDate,
    required String endDate,
    required String reason,
    String? attachmentPath,
  }) {
    return _add(
      PendingSubmission(
        id: _id(),
        type: PendingSubmissionType.leave,
        createdAt: DateTime.now(),
        payload: {
          'type': type,
          'startDate': startDate,
          'endDate': endDate,
          'reason': reason,
          if (attachmentPath != null && attachmentPath.isNotEmpty)
            'attachmentPath': attachmentPath,
        },
      ),
    );
  }

  Future<SyncResult> syncAll(ApiClient api) async {
    final items = await list();
    var synced = 0;
    final failed = <PendingSubmission>[];

    for (final item in items) {
      try {
        await _syncOne(api, item);
        synced += 1;
      } on NetworkException {
        failed.add(item);
      } on ApiException {
        failed.add(item);
      }
    }

    await _save(failed);
    return SyncResult(synced: synced, remaining: failed.length);
  }

  Future<void> _syncOne(ApiClient api, PendingSubmission item) async {
    switch (item.type) {
      case PendingSubmissionType.activity:
        final photoUrls = <String>[];
        final photoPath = item.payload['photoPath']?.toString();
        if (photoPath != null && photoPath.isNotEmpty) {
          final upload = await api.uploadFile(
            path: photoPath,
            type: 'activity',
          );
          final url = upload['url']?.toString();
          if (url != null && url.isNotEmpty) photoUrls.add(url);
        }

        await api.createActivity(
          activityDate: item.payload['activityDate'].toString(),
          title: item.payload['title'].toString(),
          description: item.payload['description'].toString(),
          status: item.payload['status']?.toString() ?? 'DRAFT',
          latitude: _doubleOrNull(item.payload['latitude']),
          longitude: _doubleOrNull(item.payload['longitude']),
          photoUrls: photoUrls,
        );
      case PendingSubmissionType.leave:
        String? attachmentUrl;
        final attachmentPath = item.payload['attachmentPath']?.toString();
        if (attachmentPath != null && attachmentPath.isNotEmpty) {
          final upload = await api.uploadFile(
            path: attachmentPath,
            type: 'leave',
          );
          attachmentUrl = upload['url']?.toString();
        }

        await api.createLeaveRequest(
          type: item.payload['type'].toString(),
          startDate: item.payload['startDate'].toString(),
          endDate: item.payload['endDate'].toString(),
          reason: item.payload['reason'].toString(),
          attachmentUrl: attachmentUrl,
        );
    }
  }

  Future<void> _add(PendingSubmission item) async {
    final items = [...await list(), item];
    await _save(items);
  }

  Future<void> _save(List<PendingSubmission> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      _storageKey,
      items.map((item) => jsonEncode(item.toJson())).toList(),
    );
  }

  PendingSubmission? _decode(String value) {
    try {
      final json = jsonDecode(value);
      if (json is! Map<String, dynamic>) return null;
      return PendingSubmission.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  double? _doubleOrNull(Object? value) {
    if (value == null) return null;
    return double.tryParse(value.toString());
  }

  String _id() => DateTime.now().microsecondsSinceEpoch.toString();
}

class PendingSubmission {
  const PendingSubmission({
    required this.id,
    required this.type,
    required this.createdAt,
    required this.payload,
  });

  final String id;
  final PendingSubmissionType type;
  final DateTime createdAt;
  final Map<String, dynamic> payload;

  factory PendingSubmission.fromJson(Map<String, dynamic> json) {
    return PendingSubmission(
      id: json['id']?.toString() ?? '',
      type: PendingSubmissionType.values.firstWhere(
        (type) => type.name == json['type']?.toString(),
        orElse: () => PendingSubmissionType.activity,
      ),
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      payload: json['payload'] is Map<String, dynamic>
          ? json['payload'] as Map<String, dynamic>
          : <String, dynamic>{},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'createdAt': createdAt.toIso8601String(),
      'payload': payload,
    };
  }
}

enum PendingSubmissionType { activity, leave }

class SyncResult {
  const SyncResult({required this.synced, required this.remaining});

  final int synced;
  final int remaining;
}
