import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/services/api_service.dart';
import 'package:file_picker/file_picker.dart';

class BillsScreen extends StatefulWidget {
  const BillsScreen({super.key});

  @override
  State<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends State<BillsScreen> {
  List<dynamic> bills = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _loadBills();
  }

  // ============================================================
  // AMBIL DATA TAGIHAN
  // ============================================================

  Future<void> _loadBills() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final data = await ApiService.getTenantBills();

      if (!mounted) return;

      setState(() {
        bills = data;
        isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        isLoading = false;
        errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '');
      });
    }
  }

  // ============================================================
  // FORMAT RUPIAH
  // ============================================================

  String _formatRupiah(dynamic amount) {
    final number = double.tryParse(amount.toString()) ?? 0;

    return NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    ).format(number);
  }

  // ============================================================
  // FORMAT TANGGAL
  // ============================================================

  String _formatDate(dynamic date) {
    if (date == null || date.toString().isEmpty) {
      return '-';
    }

    try {
      final parsedDate = DateTime.parse(date.toString());

      return DateFormat(
        'dd MMMM yyyy',
        'id_ID',
      ).format(parsedDate);
    } catch (_) {
      return date.toString();
    }
  }

  // ============================================================
  // STATUS
  // ============================================================

  String _statusText(String? status) {
    switch (status) {
      case 'paid':
        return 'Lunas';

      case 'pending':
        return 'Menunggu Konfirmasi';

      case 'rejected':
        return 'Ditolak';

      case 'unpaid':
        return 'Belum Dibayar';

      default:
        return status ?? '-';
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'paid':
        return Colors.green;

      case 'pending':
        return Colors.orange;

      case 'rejected':
        return Colors.red;

      case 'unpaid':
        return Colors.redAccent;

      default:
        return Colors.grey;
    }
  }

  // ============================================================
  // CARD TAGIHAN
  // ============================================================

  Widget _buildBillCard(Map<String, dynamic> bill) {
    final status = bill['status']?.toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // HEADER
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF3FF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.receipt_long_rounded,
                  color: Color(0xFF1976D2),
                  size: 24,
                ),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text(
                      bill['title']?.toString() ??
                          'Tagihan Kost',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1F2937),
                      ),
                    ),

                    const SizedBox(height: 4),

                    Text(
                      bill['period']?.toString() ?? '-',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),

              // STATUS
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: _statusColor(status)
                      .withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _statusText(status),
                  style: TextStyle(
                    color: _statusColor(status),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // NOMINAL
          const Text(
            'Total Tagihan',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),

          const SizedBox(height: 4),

          Text(
            _formatRupiah(bill['amount']),
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1976D2),
            ),
          ),

          const SizedBox(height: 14),

          // JATUH TEMPO
          Row(
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                size: 16,
                color: Colors.grey,
              ),

              const SizedBox(width: 8),

              const Text(
                'Jatuh tempo:',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey,
                ),
              ),

              const SizedBox(width: 5),

              Text(
                _formatDate(bill['due_date']),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF374151),
                ),
              ),
            ],
          ),

          // BUTTON BAYAR
          if (status == 'unpaid' ||
              status == 'rejected') ...[
            const SizedBox(height: 18),

            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: () {
                  _showPaymentInfo(bill);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      const Color(0xFF1976D2),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Bayar Sekarang',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ============================================================
  // PAYMENT INFO
  // ============================================================

  void _showPaymentInfo(
    Map<String, dynamic> bill,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment:
                CrossAxisAlignment.start,
            children: [

              const Text(
                'Pembayaran Tagihan',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),

              const SizedBox(height: 10),

              Text(
                bill['title']?.toString() ??
                    'Tagihan Kost',
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),

              const SizedBox(height: 18),

              Text(
                _formatRupiah(bill['amount']),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1976D2),
                ),
              ),

              const SizedBox(height: 20),

              const Text(
                'Silakan lakukan pembayaran melalui metode '
                'yang telah ditentukan oleh pemilik kost, '
                'kemudian upload bukti pembayarannya.',
                style: TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: Colors.black87,
                ),
              ),

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);

                    _uploadProof(
                      bill['id'],
                    );
                  },
                  icon: const Icon(
                    Icons.upload_file_rounded,
                  ),
                  label: const Text(
                    'Upload Bukti Pembayaran',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        const Color(0xFF1976D2),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  // ============================================================
  // UPLOAD BUKTI
  // ============================================================

Future<void> _uploadProof(dynamic billId) async {
  try {
    final files = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: [
        'jpg',
        'jpeg',
        'png',
        'pdf',
      ],
    );

    if (files.isEmpty) {
      return;
    }

    final file = files.first;

    final fileBytes = await file.readAsBytes();

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) {
        return const Center(
          child: CircularProgressIndicator(
            color: Color(0xFF1976D2),
          ),
        );
      },
    );

    await ApiService.uploadPaymentProof(
      billId: int.parse(billId.toString()),
      fileBytes: fileBytes,
      fileName: file.name,
    );

    if (!mounted) return;

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Bukti pembayaran berhasil dikirim.',
        ),
        backgroundColor: Colors.green,
      ),
    );

    await _loadBills();
  } catch (e) {
    if (!mounted) return;

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          e.toString().replaceFirst('Exception: ', ''),
        ),
        backgroundColor: Colors.red,
      ),
    );
  }
}
  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,

        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Color(0xFF1F2937),
            size: 20,
          ),
          onPressed: () {
            Navigator.pop(context);
          },
        ),

        title: const Text(
          'Tagihan Saya',
          style: TextStyle(
            color: Color(0xFF1F2937),
            fontSize: 19,
            fontWeight: FontWeight.w700,
          ),
        ),

        centerTitle: true,

        actions: [
          IconButton(
            onPressed: _loadBills,
            icon: const Icon(
              Icons.refresh_rounded,
              color: Color(0xFF1976D2),
            ),
          ),
        ],
      ),

      body: RefreshIndicator(
        onRefresh: _loadBills,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {

    // LOADING
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF1976D2),
        ),
      );
    }

    // ERROR
    if (errorMessage != null) {
      return ListView(
        physics:
            const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height:
                MediaQuery.of(context).size.height *
                    0.3,
          ),

          const Icon(
            Icons.error_outline_rounded,
            size: 60,
            color: Colors.redAccent,
          ),

          const SizedBox(height: 16),

          Center(
            child: Text(
              errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.grey,
              ),
            ),
          ),

          const SizedBox(height: 16),

          Center(
            child: ElevatedButton(
              onPressed: _loadBills,
              child: const Text('Coba Lagi'),
            ),
          ),
        ],
      );
    }

    // EMPTY
    if (bills.isEmpty) {
      return ListView(
        physics:
            const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height:
                MediaQuery.of(context).size.height *
                    0.28,
          ),

          const Icon(
            Icons.receipt_long_outlined,
            size: 70,
            color: Color(0xFF90CAF9),
          ),

          const SizedBox(height: 18),

          const Center(
            child: Text(
              'Belum Ada Tagihan',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),

          const SizedBox(height: 8),

          const Center(
            child: Text(
              'Belum ada tagihan yang diberikan\n'
              'oleh pemilik kost.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey,
                height: 1.5,
              ),
            ),
          ),
        ],
      );
    }

    // DATA
    return ListView(
      padding: const EdgeInsets.all(20),
      physics:
          const AlwaysScrollableScrollPhysics(),
      children: [

        const Text(
          'Daftar Tagihan',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F2937),
          ),
        ),

        const SizedBox(height: 6),

        Text(
          '${bills.length} tagihan ditemukan',
          style: const TextStyle(
            fontSize: 13,
            color: Colors.grey,
          ),
        ),

        const SizedBox(height: 20),

        ...bills.map(
          (bill) => _buildBillCard(
            Map<String, dynamic>.from(bill),
          ),
        ),
      ],
    );
  }
}