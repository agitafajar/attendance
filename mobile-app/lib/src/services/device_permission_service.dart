import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart' as permission;

import '../api/api_client.dart';

class DevicePermissionService {
  Future<void> ensureCamera() async {
    final status = await permission.Permission.camera.request();

    if (status.isGranted || status.isLimited) return;

    if (status.isPermanentlyDenied || status.isRestricted) {
      final opened = await permission.openAppSettings();
      throw ApiException(
        opened
            ? 'Izin kamera diblokir. Aktifkan kamera di pengaturan aplikasi.'
            : 'Izin kamera diblokir.',
      );
    }

    throw ApiException('Izin kamera diperlukan untuk selfie.');
  }

  Future<Position?> optionalLocation({
    Duration timeLimit = const Duration(seconds: 12),
  }) async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    var permissionStatus = await Geolocator.checkPermission();
    if (permissionStatus == LocationPermission.denied) {
      permissionStatus = await Geolocator.requestPermission();
    }

    if (permissionStatus == LocationPermission.denied ||
        permissionStatus == LocationPermission.deniedForever) {
      return null;
    }

    return _currentPosition(timeLimit);
  }

  Future<Position> requiredLocation({
    Duration timeLimit = const Duration(seconds: 15),
  }) async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw ApiException('GPS belum aktif. Aktifkan lokasi dulu.');
    }

    var permissionStatus = await Geolocator.checkPermission();
    if (permissionStatus == LocationPermission.denied) {
      permissionStatus = await Geolocator.requestPermission();
    }

    if (permissionStatus == LocationPermission.denied) {
      throw ApiException('Izin lokasi diperlukan untuk validasi geofence.');
    }

    if (permissionStatus == LocationPermission.deniedForever) {
      final opened = await permission.openAppSettings();
      throw ApiException(
        opened
            ? 'Izin lokasi diblokir. Aktifkan lokasi di pengaturan aplikasi.'
            : 'Izin lokasi diblokir.',
      );
    }

    return _currentPosition(timeLimit);
  }

  Future<Position> _currentPosition(Duration timeLimit) {
    return Geolocator.getCurrentPosition(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: timeLimit,
      ),
    );
  }
}
