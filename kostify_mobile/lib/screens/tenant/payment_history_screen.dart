import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/services/api_service.dart';

class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() =>
      _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState
    extends State<PaymentHistoryScreen> {

  List<dynamic> histories = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final data = await ApiService.getTenantBills();

      final filtered = data.where((bill) {
        final status = bill['status']?.toString();

        return status == 'paid' ||
            status == 'pending' ||
            status == 'rejected';
      }).toList();

      if (!mounted) return;

      setState(() {
        histories = filtered;
        isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        isLoading = false;
        errorMessage =
            e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  String _formatRupiah(dynamic amount) {
    final number =
        double.tryParse(amount.toString()) ?? 0;

    return NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    ).format(number);
  }

  String _formatDate(dynamic date) {
    if (date == null || date.toString().isEmpty) {
      return '-';
    }

    try {
      return DateFormat(
        'dd MMMM yyyy',
        'id_ID',
      ).format(
        DateTime.parse(date.toString()),
      );
    } catch (_) {
      return date.toString();
    }
  }

  String _statusText(String? status) {
    switch (status) {
      case 'paid':
        return 'Lunas';

      case 'pending':
        return 'Menunggu Konfirmasi';

      case 'rejected':
        return 'Ditolak';

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

      default:
        return Colors.grey;
    }
  }

  Widget _historyCard(
    Map<String, dynamic> bill,
  ) {
    final status =
        bill['status']?.toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
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
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [

          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF3FF),
              borderRadius:
                  BorderRadius.circular(14),
            ),
            child: Icon(
              status == 'paid'
                  ? Icons.check_circle_outline_rounded
                  : status == 'pending'
                      ? Icons.access_time_rounded
                      : Icons.cancel_outlined,
              color: _statusColor(status),
              size: 25,
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

                const SizedBox(height: 5),

                Text(
                  bill['period']?.toString() ?? '-',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.grey,
                  ),
                ),

                const SizedBox(height: 12),

                Text(
                  _formatRupiah(bill['amount']),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1976D2),
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  'Jatuh tempo: '
                  '${_formatDate(bill['due_date'])}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 9,
              vertical: 6,
            ),
            decoration: BoxDecoration(
              color: _statusColor(status)
                  .withOpacity(0.1),
              borderRadius:
                  BorderRadius.circular(20),
            ),
            child: Text(
              _statusText(status),
              style: TextStyle(
                color: _statusColor(status),
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor:
          const Color(0xFFF5F9FF),

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
          'Riwayat Pembayaran',
          style: TextStyle(
            color: Color(0xFF1F2937),
            fontSize: 19,
            fontWeight: FontWeight.w700,
          ),
        ),

        centerTitle: true,

        actions: [
          IconButton(
            onPressed: _loadHistory,
            icon: const Icon(
              Icons.refresh_rounded,
              color: Color(0xFF1976D2),
            ),
          ),
        ],
      ),

      body: RefreshIndicator(
        onRefresh: _loadHistory,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF1976D2),
        ),
      );
    }

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
              onPressed: _loadHistory,
              child: const Text('Coba Lagi'),
            ),
          ),
        ],
      );
    }

    if (histories.isEmpty) {
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
            Icons.history_rounded,
            size: 70,
            color: Color(0xFF90CAF9),
          ),

          const SizedBox(height: 18),

          const Center(
            child: Text(
              'Belum Ada Riwayat',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),

          const SizedBox(height: 8),

          const Center(
            child: Text(
              'Riwayat pembayaran kamu\n'
              'akan muncul di sini.',
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

    return ListView(
      padding: const EdgeInsets.all(20),
      physics:
          const AlwaysScrollableScrollPhysics(),
      children: [

        const Text(
          'Riwayat Pembayaran',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F2937),
          ),
        ),

        const SizedBox(height: 6),

        Text(
          '${histories.length} riwayat ditemukan',
          style: const TextStyle(
            fontSize: 13,
            color: Colors.grey,
          ),
        ),

        const SizedBox(height: 20),

        ...histories.map(
          (bill) => _historyCard(
            Map<String, dynamic>.from(bill),
          ),
        ),
      ],
    );
  }
}