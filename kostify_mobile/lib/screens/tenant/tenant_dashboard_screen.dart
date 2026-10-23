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
  State<TenantDashboardScreen> createState() => _TenantDashboardScreenState();
}

class _TenantDashboardScreenState extends State<TenantDashboardScreen> {
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
        newKostName = tenant['kost']['name']?.toString() ?? '-';
      } else if (tenant['kost_name'] != null) {
        newKostName = tenant['kost_name']?.toString() ?? '-';
      }

      // Kamar
      if (tenant['room'] != null) {
        newRoomNumber = tenant['room']['room_number']?.toString() ?? '-';
      } else if (tenant['room_number'] != null) {
        newRoomNumber = tenant['room_number']?.toString() ?? '-';
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
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Row(
          children: [
            Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 24),
            SizedBox(width: 10),
            Text(
              'Konfirmasi Keluar',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: const Text(
          'Apakah Anda yakin ingin keluar dari akun Kostify?',
          style: TextStyle(fontSize: 14, color: Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Batal',
              style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );

    if (shouldLogout != true) return;

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

  void _showKostGuideModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.65,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: ListView(
                controller: scrollController,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Row(
                    children: [
                      Icon(Icons.cottage_rounded, color: Color(0xFF059669), size: 28),
                      SizedBox(width: 12),
                      Text(
                        'Informasi & Tata Tertib',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildGuideItem(
                    icon: Icons.payments_outlined,
                    title: 'Pembayaran Tepat Waktu',
                    desc: 'Lakukan konfirmasi sebelum jatuh tempo setiap bulannya untuk kenyamanan bersama.',
                  ),
                  _buildGuideItem(
                    icon: Icons.cleaning_services_outlined,
                    title: 'Kebersihan Bersama',
                    desc: 'Jaga kebersihan kamar dan buang sampah pada tempat yang telah disediakan pemilik.',
                  ),
                  _buildGuideItem(
                    icon: Icons.volume_down_outlined,
                    title: 'Ketenangan Hunian',
                    desc: 'Harap menjaga ketenangan terutama pada jam istirahat malam (22:00 - 06:00 WIB).',
                  ),
                  _buildGuideItem(
                    icon: Icons.handyman_outlined,
                    title: 'Lapor Kendala Cepat',
                    desc: 'Jika ada fasilitas yang rusak, gunakan menu "Komplain" agar pemilik segera memperbaikinya.',
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text(
                        'Tutup Panduan',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  static Widget _buildGuideItem({
    required IconData icon,
    required String title,
    required String desc,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: const Color(0xFF059669), size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  desc,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleSpacing: 20,
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              clipBehavior: Clip.antiAlias,
              child: Image.asset(
                'assets/icon/app_logo.png',
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'Kostify',
              style: TextStyle(
                color: Color(0xFF065F46),
                fontWeight: FontWeight.w800,
                fontSize: 20,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: IconButton(
              onPressed: _logout,
              tooltip: 'Keluar',
              padding: const EdgeInsets.all(8),
              constraints: const BoxConstraints(),
              icon: const Icon(
                Icons.logout_rounded,
                color: Color(0xFFDC2626),
                size: 20,
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadTenantData,
        color: const Color(0xFF059669),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // =========================
              // GREETING SECTION
              // =========================
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF10B981), Color(0xFF059669)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF059669).withValues(alpha: 0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        userName.isNotEmpty ? userName[0].toUpperCase() : 'K',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Halo, $userName 👋',
                          style: const TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        const Text(
                          'Selamat beristirahat di hunianmu',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 22),

              // =========================
              // KOST HERO CARD (EMERALD GRADIENT)
              // =========================
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF059669),
                      Color(0xFF047857),
                      Color(0xFF065F46),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF059669).withValues(alpha: 0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // TOP ROW (TAGS)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.25),
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.verified_rounded,
                                color: Color(0xFFA7F3D0),
                                size: 14,
                              ),
                              SizedBox(width: 5),
                              Text(
                                'HUNIAN AKTIF',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // ROOM BADGE
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.meeting_room_rounded,
                                color: Color(0xFF059669),
                                size: 14,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                'Kamar $roomNumber',
                                style: const TextStyle(
                                  color: Color(0xFF065F46),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // KOST NAME
                    Text(
                      kostName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),

                    const SizedBox(height: 8),

                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 15,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Hunian Terverifikasi Pemilik Kost',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 26),

              // =========================
              // MENU SECTION
              // =========================
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Menu Layanan',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    '3 Fitur Utama',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // 2x2 BALANCED GRID
              Row(
                children: [
                  Expanded(
                    child: _buildModernMenuCard(
                      icon: Icons.receipt_long_rounded,
                      iconBg: const Color(0xFFECFDF5),
                      iconColor: const Color(0xFF059669),
                      title: 'Tagihan Sewa',
                      subtitle: 'Cek & bayar sewa',
                      badgeText: 'Penting',
                      badgeColor: const Color(0xFFFEF3C7),
                      badgeTextColor: const Color(0xFFB45309),
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
                    child: _buildModernMenuCard(
                      icon: Icons.history_rounded,
                      iconBg: const Color(0xFFF0FDF4),
                      iconColor: const Color(0xFF0D9488),
                      title: 'Riwayat Bayar',
                      subtitle: 'Arsip bukti tagihan',
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
                    child: _buildModernMenuCard(
                      icon: Icons.support_agent_rounded,
                      iconBg: const Color(0xFFFFFBEB),
                      iconColor: const Color(0xFFD97706),
                      title: 'Komplain',
                      subtitle: 'Lapor fasilitas rusak',
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
                  Expanded(
                    child: _buildModernMenuCard(
                      icon: Icons.menu_book_rounded,
                      iconBg: const Color(0xFFF1F5F9),
                      iconColor: const Color(0xFF475569),
                      title: 'Aturan Kost',
                      subtitle: 'Panduan kenyamanan',
                      onTap: _showKostGuideModal,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // =========================
              // TIPS BANNER
              // =========================
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFFA7F3D0),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.lightbulb_outline_rounded,
                        color: Color(0xFF059669),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Tips Kenyamanan Kost',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF065F46),
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Simpan bukti pembayaran dan segera laporkan kendala kamar agar cepat ditindaklanjuti pemilik.',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF047857),
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernMenuCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    String? badgeText,
    Color? badgeColor,
    Color? badgeTextColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      elevation: 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: const Color(0xFFE2E8F0),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: iconBg,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      icon,
                      size: 24,
                      color: iconColor,
                    ),
                  ),
                  if (badgeText != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: badgeColor ?? const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        badgeText,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: badgeTextColor ?? const Color(0xFF059669),
                        ),
                      ),
                    )
                  else
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 13,
                      color: Color(0xFFCBD5E1),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11.5,
                  color: Color(0xFF64748B),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
