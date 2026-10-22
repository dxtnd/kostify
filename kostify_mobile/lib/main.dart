import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'firebase_options.dart';
import 'screens/tenant/tenant_login_screen.dart';
import 'core/services/api_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // FCM: menerima notifikasi saat aplikasi terbuka.
  // Pesan ditampilkan di Debug Console.
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    debugPrint('====================================');
    debugPrint('Notifikasi diterima saat aplikasi terbuka');

    if (message.notification != null) {
      debugPrint(
        'Judul: ${message.notification!.title ?? 'Kostify'}',
      );
      debugPrint(
        'Pesan: ${message.notification!.body ?? ''}',
      );
    }

    debugPrint('====================================');
  });

  runApp(const KostifyApp());
}

class KostifyApp extends StatefulWidget {
  const KostifyApp({super.key});

  @override
  State<KostifyApp> createState() => _KostifyAppState();
}

class _KostifyAppState extends State<KostifyApp> {
  @override
  void initState() {
    super.initState();

    if (!kIsWeb) {
      _initializeMessaging();
    }
  }

  Future<void> _initializeMessaging() async {
    try {
      final messaging = FirebaseMessaging.instance;

      // Simpan token baru jika Firebase memperbaruinya.
      messaging.onTokenRefresh.listen((newToken) async {
        try {
          await ApiService.saveFcmToken(newToken);
          debugPrint('FCM token baru berhasil disimpan ke Laravel');
        } catch (e) {
          debugPrint('FCM token belum disimpan: $e');
        }
      });

      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      final token = await messaging.getToken();
      debugPrint('FCM token berhasil diinisialisasi');

      // Token tidak ditampilkan di layar.
      // Penyimpanan token ke Laravel dilakukan setelah login berhasil.
      if (token != null && token.isNotEmpty) {
        debugPrint('FCM token tersedia');
      }
    } catch (e) {
      debugPrint('FCM ERROR: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Kostify',
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Roboto',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF059669),
          primary: const Color(0xFF059669),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF0F172A),
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      home: const TenantLoginScreen(),
    );
  }
}
