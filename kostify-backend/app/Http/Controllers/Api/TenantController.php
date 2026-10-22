<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\Bill;
use App\Models\Complaint;
use App\Models\DeviceToken;

class TenantController extends Controller
{
    public function bills(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'tenant') {
            return response()->json([
                'message' => 'Akses hanya untuk Anak Kos.'
            ], 403);
        }

        $tenant = Tenant::where('user_id', $user->id)->first();

        if (!$tenant) {
            return response()->json([
                'message' => 'Data Anak Kos tidak ditemukan.'
            ], 404);
        }

        $bills = Bill::where('tenant_id', $tenant->id)
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data tagihan berhasil diambil.',
            'data' => $bills
        ]);
    }

    public function uploadPaymentProof(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'tenant') {
            return response()->json([
                'message' => 'Akses hanya untuk Anak Kos.'
            ], 403);
        }

        $tenant = Tenant::where('user_id', $user->id)->first();

        if (!$tenant) {
            return response()->json([
                'message' => 'Data Anak Kos tidak ditemukan.'
            ], 404);
        }

        $bill = Bill::where('id', $id)
            ->where('tenant_id', $tenant->id)
            ->first();

        if (!$bill) {
            return response()->json([
                'message' => 'Tagihan tidak ditemukan atau bukan milik Anda.'
            ], 404);
        }

        if ($bill->status === 'paid') {
            return response()->json([
                'message' => 'Tagihan ini sudah lunas.'
            ], 422);
        }

        if ($bill->status === 'pending') {
            return response()->json([
                'message' => 'Bukti pembayaran sudah dikirim dan sedang menunggu konfirmasi.'
            ], 422);
        }

        $validated = $request->validate([
            'payment_proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $file = $request->file('payment_proof');

        $fileName = time() . '_' . $file->getClientOriginalName();

        $filePath = $file->storeAs(
            'payment_proofs',
            $fileName,
            'public'
        );

        $bill->update([
            'payment_proof' => $filePath,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diupload dan menunggu konfirmasi.',
            'data' => $bill->fresh()
        ]);
    }

    public function storeComplaint(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'tenant') {
            return response()->json([
                'message' => 'Akses hanya untuk Anak Kos.'
            ], 403);
        }

        $tenant = Tenant::where('user_id', $user->id)->first();

        if (!$tenant) {
            return response()->json([
                'message' => 'Data Anak Kos tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        $complaint = Complaint::create([
            'tenant_id' => $tenant->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'submitted',
        ]);

        return response()->json([
            'message' => 'Komplain berhasil dikirim.',
            'data' => $complaint->load([
                'tenant.user:id,name,nik',
                'tenant.kost:id,name',
                'tenant.room:id,room_number'
            ])
        ], 201);
    }

    public function saveFcmToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string|max:500',
            'device_type' => 'nullable|string|max:50',
        ]);

        $deviceToken = DeviceToken::updateOrCreate(
            [
                'token' => $request->token,
            ],
            [
                'user_id' => auth()->id(),
                'device_type' => $request->device_type,
            ]
        );

        return response()->json([
            'message' => 'FCM token berhasil disimpan',
            'data' => $deviceToken,
        ], 200);
    }

    // public function uploadPaymentProof(Request $request, $id)
    // {
    //     $user = $request->user();

    //     if (!$user) {
    //         return response()->json([
    //             'message' => 'Unauthenticated.'
    //         ], 401);
    //     }

    //     if ($user->role !== 'tenant') {
    //         return response()->json([
    //             'message' => 'Akses hanya untuk Anak Kos.'
    //         ], 403);
    //     }

    //     $tenant = Tenant::where('user_id', $user->id)->first();

    //     if (!$tenant) {
    //         return response()->json([
    //             'message' => 'Data Anak Kos tidak ditemukan.'
    //         ], 404);
    //     }

    //     $bill = Bill::where('id', $id)
    //         ->where('tenant_id', $tenant->id)
    //         ->first();

    //     if (!$bill) {
    //         return response()->json([
    //             'message' => 'Tagihan tidak ditemukan atau bukan milik Anda.'
    //         ], 404);
    //     }

    //     if ($bill->status === 'paid') {
    //         return response()->json([
    //             'message' => 'Tagihan ini sudah lunas.'
    //         ], 422);
    //     }

    //     if ($bill->status === 'pending') {
    //         return response()->json([
    //             'message' => 'Bukti pembayaran sudah dikirim dan sedang menunggu konfirmasi.'
    //         ], 422);
    //     }

    //     $validated = $request->validate([
    //         'payment_proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
    //     ]);

    //     $file = $request->file('payment_proof');

    //     $fileName = time() . '_' . $file->getClientOriginalName();

    //     $filePath = $file->storeAs(
    //         'payment_proofs',
    //         $fileName,
    //         'public'
    //     );

    //     $bill->update([
    //         'payment_proof' => $filePath,
    //         'status' => 'pending',
    //     ]);

    //     return response()->json([
    //         'message' => 'Bukti pembayaran berhasil diupload dan menunggu konfirmasi.',
    //         'data' => $bill->fresh()
    //     ]);
    // }
}