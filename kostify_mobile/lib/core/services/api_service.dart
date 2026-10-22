
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://127.0.0.1:8000/api';

  // ============================================================
  // TENANT LOGIN
  // ============================================================


  static Future<Map<String, dynamic>> tenantLogin({
    required String nik,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/tenant/login'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({
        'nik': nik,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString('token', data['token']);
      await prefs.setString('user', jsonEncode(data['user']));

      if (data['tenant'] != null) {
        await prefs.setString(
          'tenant',
          jsonEncode(data['tenant']),
        );
      }

      return data;
    }

    throw Exception(data['message'] ?? 'Login gagal.');
  }


  // ============================================================
  // GET TOKEN LOGIN
  // ============================================================

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  // ============================================================
  // GET TAGIHAN TENANT
  // ============================================================

  static Future<List<dynamic>> getTenantBills() async {
    final token = await getToken();

    if (token == null) {
      throw Exception(
        'Token tidak ditemukan. Silakan login kembali.',
      );
    }

    final response = await http.get(
      Uri.parse('$baseUrl/tenant/bills'),
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data['data'] ?? [];
    }

    if (response.statusCode == 401) {
      throw Exception(
        'Sesi login telah berakhir. Silakan login kembali.',
      );
    }

    throw Exception(
      data['message'] ?? 'Gagal mengambil data tagihan.',
    );
  }

  // ============================================================
  // UPLOAD BUKTI PEMBAYARAN
  // ============================================================

  static Future<Map<String, dynamic>> uploadPaymentProof({
    required int billId,
    required Uint8List fileBytes,
    required String fileName,
  }) async {
    final token = await getToken();

    if (token == null) {
      throw Exception(
        'Token tidak ditemukan. Silakan login kembali.',
      );
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/tenant/bills/$billId/payment'),
    );

    request.headers.addAll({
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    });

    request.files.add(
      http.MultipartFile.fromBytes(
        'payment_proof',
        fileBytes,
        filename: fileName,
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(
      streamedResponse,
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data;
    }

    if (response.statusCode == 401) {
      throw Exception(
        'Sesi login telah berakhir. Silakan login kembali.',
      );
    }

    throw Exception(
      data['message'] ??
          'Gagal mengupload bukti pembayaran.',
    );
  }

  // ============================================================
  // KIRIM KOMPLAIN
  // ============================================================

  static Future<void> sendComplaint({
    required String description,
  }) async {
    final token = await getToken();

    if (token == null) {
      throw Exception(
        'Token tidak ditemukan. Silakan login kembali.',
      );
    }

    final response = await http.post(
      Uri.parse('$baseUrl/tenant/complaints'),
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'title': 'Komplain Penghuni',
        'description': description,
      }),
    );

    if (response.statusCode >= 200 &&
        response.statusCode < 300) {
      return;
    }

    try {
      final data = jsonDecode(response.body);

      if (data['errors'] != null) {
        final errors = data['errors'];
        final firstField = errors.values.first;

        if (firstField is List && firstField.isNotEmpty) {
          throw Exception(firstField.first.toString());
        }
      }

      throw Exception(
        data['message']?.toString() ??
            'Gagal mengirim komplain.',
      );
    } catch (e) {
      if (e is Exception) {
        rethrow;
      }

      throw Exception(
        'Gagal mengirim komplain. '
        'Kode: ${response.statusCode}',
      );
    }
  }

  // ============================================================
  // SIMPAN / PERBARUI FCM TOKEN
  // POST /api/tenant/fcm-token
  // ============================================================

  static Future<void> saveFcmToken(String fcmToken) async {
    final loginToken = await getToken();

    if (loginToken == null || loginToken.isEmpty) {
      throw Exception(
        'Token login tidak ditemukan. Login Anak Kos terlebih dahulu.',
      );
    }

    if (fcmToken.isEmpty) {
      throw Exception('FCM Token kosong.');
    }

    final response = await http.post(
      Uri.parse('$baseUrl/tenant/fcm-token'),
      headers: {
        'Authorization': 'Bearer $loginToken',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': fcmToken,
        'device_type': 'android',
      }),
    );

    if (response.statusCode >= 200 &&
        response.statusCode < 300) {
      return;
    }

    String message =
        'Gagal menyimpan FCM token. '
        'Kode: ${response.statusCode}';

    try {
      final data = jsonDecode(response.body);
      message = data['message']?.toString() ?? message;
    } catch (_) {
      // Gunakan pesan default jika respons bukan JSON.
    }

    throw Exception(message);
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  static Future<void> logout() async {
    final token = await getToken();

    if (token != null) {
      await http.post(
        Uri.parse('$baseUrl/logout'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
    }

    final prefs = await SharedPreferences.getInstance();

    await prefs.remove('token');
    await prefs.remove('user');
    await prefs.remove('tenant');
  }
}
