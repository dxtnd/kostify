import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../../core/services/api_service.dart';
import 'tenant_login_screen.dart';
import 'bills_screen.dart';
import 'payment_history_screen.dart';
import 'complaint_screen.dart';

class TenantDashboardScreen extends StatefulWidget {
  const TenantDashboardScreen({super.key});

  @override
  State<TenantDashboardScreen> createState() =>
      _TenantDashboardScreenState();
}

class _TenantDashboardScreenState
    extends State<TenantDashboardScreen> {

  String userName = 'Anak Kos';
  String kostName = '-';
  String roomNumber = '-';

  @override
  void initState() {
    super.initState();
    _loadTenantData();
  }

  Future<void> _loadTenantData() async {
    final prefs = await SharedPreferences.getInstance();

    final userData = prefs.getString('user');
    final tenantData = prefs.getString('tenant');

    String newUserName = 'Anak Kos';
    String newKostName = '-';
    String newRoomNumber = '-';

    // Ambil data user
    if (userData != null && userData.isNotEmpty) {
      final user = jsonDecode(userData);

      newUserName = user['name']?.toString() ?? 'Anak Kos';
    }

    // Ambil data tenant
    if (tenantData != null && tenantData.isNotEmpty) {
      final tenant = jsonDecode(tenantData);

      // Kost
      if (tenant['kost'] != null) {
        newKostName =
            tenant['kost']['name']?.toString() ?? '-';
      } else if (tenant['kost_name'] != null) {
        newKostName =
            tenant['kost_name']?.toString() ?? '-';
      }

      // Kamar
      if (tenant['room'] != null) {
        newRoomNumber =
            tenant['room']['room_number']?.toString() ?? '-';
      } else if (tenant['room_number'] != null) {
        newRoomNumber =
            tenant['room_number']?.toString() ?? '-';
      }
    }

    if (!mounted) return;

    setState(() {
      userName = newUserName;
      kostName = newKostName;
      roomNumber = newRoomNumber;
    });
  }

  Future<void> _logout() async {
    await ApiService.logout();

    if (!mounted) return;

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (_) => const TenantLoginScreen(),
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Kostify',
          style: TextStyle(
            color: Color(0xFF1976D2),
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(
              Icons.logout_rounded,
              color: Colors.red,
            ),
          ),
        ],
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // =========================
            // GREETING
            // =========================

            Text(
              'Halo, $userName 👋',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),

            const SizedBox(height: 6),

            Text(
              'Selamat datang di Kostify',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),

            const SizedBox(height: 24),

            // =========================
            // KOST CARD
            // =========================

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),

              decoration: BoxDecoration(
                color: const Color(0xFF1976D2),
                borderRadius: BorderRadius.circular(20),
              ),

              child: Row(
                children: [

                  Container(
                    width: 52,
                    height: 52,

                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(15),
                    ),

                    child: const Icon(
                      Icons.home_work_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),

                  const SizedBox(width: 15),

                  Expanded(
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,

                      children: [

                        const Text(
                          'Kost Saat Ini',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                          ),
                        ),

                        const SizedBox(height: 4),

                        Text(
                          kostName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 3),

                        Text(
                          'Kamar $roomNumber',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // =========================
            // MENU
            // =========================

            const Text(
              'Menu Saya',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 14),

            Row(
              children: [
                Expanded(
                  child: _menuCard(
                    icon: Icons.receipt_long_rounded,
                    title: 'Tagihan',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const BillsScreen(),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(width: 12),

                Expanded(
                  child: _menuCard(
                    icon: Icons.history_rounded,
                    title: 'Riwayat',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const PaymentHistoryScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

              Row(
                children: [
                Expanded(
                  child: _menuCard(
                    icon: Icons.report_problem_outlined,
                    title: 'Komplain',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ComplaintScreen(),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(width: 12),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _menuCard({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),

      child: Container(
        padding: const EdgeInsets.symmetric(
          vertical: 20,
        ),

        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),

          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),

        child: Column(
          children: [

            Icon(
              icon,
              size: 30,
              color: const Color(0xFF1976D2),
            ),

            const SizedBox(height: 8),

            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}