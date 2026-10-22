<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Kost;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\Bill;
use App\Models\BillReminder;
use App\Models\Complaint;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\DeviceToken;
use App\Services\FirebaseNotificationService;

class OwnerController extends Controller
{
    public function overview(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        // Ambil semua kost milik owner yang sedang login
        $kostIds = Kost::where('owner_id', $user->id)
            ->pluck('id');

        // Hitung kamar
        $totalRooms = Room::whereIn('kost_id', $kostIds)->count();

        $occupiedRooms = Room::whereIn('kost_id', $kostIds)
            ->where('status', 'occupied')
            ->count();

        $availableRooms = Room::whereIn('kost_id', $kostIds)
            ->where('status', 'available')
            ->count();

        $maintenanceRooms = Room::whereIn('kost_id', $kostIds)
            ->where('status', 'maintenance')
            ->count();

        // Data kost milik owner
        $kosts = Kost::where('owner_id', $user->id)
            ->withCount('rooms')
            ->latest()
            ->get();

        // Daftar kamar
        $rooms = Room::whereIn('kost_id', $kostIds)
            ->with('kost:id,name')
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Dashboard Pemilik Kos berhasil diambil.',

            'owner' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],

            'statistics' => [
                'total_kosts' => $kosts->count(),
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedRooms,
                'available_rooms' => $availableRooms,
                'maintenance_rooms' => $maintenanceRooms,
            ],

            'kosts' => $kosts,

            'rooms' => $rooms,
        ]);
    }

    public function rooms(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        // Ambil ID kost milik owner yang sedang login
        $kostIds = Kost::where('owner_id', $user->id)
            ->pluck('id');

        // Ambil kamar hanya dari kost milik owner tersebut
        $rooms = Room::whereIn('kost_id', $kostIds)
            ->with('kost:id,name')
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data kamar berhasil diambil.',
            'data' => $rooms
        ]);
    }

    public function storeRoom(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        $validated = $request->validate([
            'kost_id' => 'required|exists:kosts,id',
            'room_number' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'status' => 'nullable|in:available,occupied,maintenance',
        ]);

        // Pastikan kost tersebut milik owner yang sedang login
        $kost = Kost::where('id', $validated['kost_id'])
            ->where('owner_id', $user->id)
            ->first();

        if (!$kost) {
            return response()->json([
                'message' => 'Kost tidak ditemukan atau bukan milik Anda.'
            ], 403);
        }

        // Cek nomor kamar agar tidak duplikat dalam kost yang sama
        $existingRoom = Room::where('kost_id', $kost->id)
            ->where('room_number', $validated['room_number'])
            ->exists();

        if ($existingRoom) {
            return response()->json([
                'message' => 'Nomor kamar tersebut sudah digunakan.'
            ], 422);
        }

        $room = Room::create([
            'kost_id' => $kost->id,
            'room_number' => $validated['room_number'],
            'price' => $validated['price'],
            'status' => $validated['status'] ?? 'available',
        ]);

        return response()->json([
            'message' => 'Kamar berhasil ditambahkan.',
            'data' => $room->load('kost:id,name')
        ], 201);
    }

    public function updateRoom(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        // Cari kamar yang sedang diedit
        $room = Room::with('kost')->find($id);

        if (!$room) {
            return response()->json([
                'message' => 'Kamar tidak ditemukan.'
            ], 404);
        }

        // Pastikan kamar tersebut berada di kost milik owner
        if ($room->kost->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke kamar ini.'
            ], 403);
        }

        // Validasi data
        $validated = $request->validate([
            'room_number' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'status' => 'required|in:available,occupied,maintenance',
        ]);

        // Cek nomor kamar duplikat
        $existingRoom = Room::where('kost_id', $room->kost_id)
            ->where('room_number', $validated['room_number'])
            ->where('id', '!=', $room->id)
            ->exists();

        if ($existingRoom) {
            return response()->json([
                'message' => 'Nomor kamar tersebut sudah digunakan.'
            ], 422);
        }

        // Update kamar
        $room->update([
            'room_number' => $validated['room_number'],
            'price' => $validated['price'],
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Data kamar berhasil diperbarui.',
            'data' => $room->fresh()->load('kost:id,name')
        ]);
    }

    public function deleteRoom(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        // Cari kamar beserta data kost
        $room = Room::with('kost')->find($id);

        if (!$room) {
            return response()->json([
                'message' => 'Kamar tidak ditemukan.'
            ], 404);
        }

        // Pastikan kamar milik kost owner yang sedang login
        if ($room->kost->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke kamar ini.'
            ], 403);
        }

        // Hapus kamar
        $room->delete();

        return response()->json([
            'message' => 'Kamar berhasil dihapus.'
        ]);
    }

    public function tenants(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        // Ambil ID kost milik owner yang sedang login
        $kostIds = Kost::where('owner_id', $user->id)
            ->pluck('id');

        // Ambil data penghuni dari kost milik owner
        $tenants = Tenant::whereIn('kost_id', $kostIds)
            ->with([
                'user:id,name,email,nik,role,status',
                'kost:id,name',
                'room:id,kost_id,room_number,price,status'
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data penghuni berhasil diambil.',
            'data' => $tenants
        ]);
    }

    public function updateTenant(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        $tenant = Tenant::with(['user', 'kost', 'room'])->find($id);

        if (!$tenant) {
            return response()->json([
                'message' => 'Data penghuni tidak ditemukan.'
            ], 404);
        }

        // Pastikan penghuni berada di kost milik Owner
        if ($tenant->kost->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke penghuni ini.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => 'required|string|max:255|unique:users,nik,' . $tenant->user_id,
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'identity_document' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        DB::transaction(function () use ($validated, $tenant) {

            // Update akun Anak Kos
            $tenant->user->update([
                'name' => $validated['name'],
                'nik' => $validated['nik'],
                'status' => $validated['status'],
            ]);

            // Update data penghuni
            $tenant->update([
                'phone' => $validated['phone'],
                'address' => $validated['address'] ?? null,
                'identity_document' => $validated['identity_document'] ?? null,
                'status' => $validated['status'],
            ]);
        });

        return response()->json([
            'message' => 'Data penghuni berhasil diperbarui.',
            'data' => $tenant->fresh()->load([
                'user:id,name,email,nik,role,status',
                'kost:id,name',
                'room:id,kost_id,room_number,price,status'
            ])
        ]);
    }

    public function storeBill(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'period' => 'required|string|max:50',
        ]);

        // Cari tenant sekaligus kost-nya
        $tenant = Tenant::with('kost')
            ->find($validated['tenant_id']);

        if (!$tenant) {
            return response()->json([
                'message' => 'Penghuni tidak ditemukan.'
            ], 404);
        }

        // Pastikan tenant berada di kost milik Owner
        if ($tenant->kost->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke penghuni ini.'
            ], 403);
        }

        $bill = Bill::create([
            'tenant_id' => $tenant->id,
            'title' => $validated['title'],
            'amount' => $validated['amount'],
            'due_date' => $validated['due_date'],
            'period' => $validated['period'],
            'status' => 'unpaid',
        ]);

        return response()->json([
            'message' => 'Tagihan berhasil dibuat.',
            'data' => $bill->load([
                'tenant.user:id,name,nik',
                'tenant.kost:id,name',
                'tenant.room:id,room_number'
            ])
        ], 201);
    }

    public function bills(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        // Ambil ID kost milik Owner
        $kostIds = Kost::where('owner_id', $user->id)
            ->pluck('id');

        // Ambil semua tenant di kost milik Owner
        $tenantIds = Tenant::whereIn('kost_id', $kostIds)
            ->pluck('id');

        // Ambil semua tagihan tenant tersebut
        $bills = Bill::whereIn('tenant_id', $tenantIds)
            ->with([
                'tenant.user:id,name,nik',
                'tenant.kost:id,name',
                'tenant.room:id,room_number'
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data tagihan berhasil diambil.',
            'data' => $bills
        ]);
    }

    public function updateBillStatus(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:paid,rejected',
        ]);

        $bill = Bill::with('tenant.kost')->find($id);

        if (!$bill) {
            return response()->json([
                'message' => 'Tagihan tidak ditemukan.'
            ], 404);
        }

        if ($bill->tenant->kost->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke tagihan ini.'
            ], 403);
        }

        if ($bill->status !== 'pending') {
            return response()->json([
                'message' => 'Tagihan belum berada pada status menunggu konfirmasi.'
            ], 422);
        }

        $bill->update([
            'status' => $validated['status'],
            'paid_at' => $validated['status'] === 'paid'
                ? now()
                : null,
        ]);

        return response()->json([
            'message' => $validated['status'] === 'paid'
                ? 'Pembayaran berhasil dikonfirmasi.'
                : 'Pembayaran ditolak.',
            'data' => $bill->fresh()->load([
                'tenant.user:id,name,nik',
                'tenant.kost:id,name',
                'tenant.room:id,room_number'
            ])
        ]);
    }

    public function sendBillReminder(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        $bill = Bill::with('tenant.kost')->find($id);

        if (!$bill) {
            return response()->json([
                'message' => 'Tagihan tidak ditemukan.'
            ], 404);
        }

        if ($bill->tenant->kost->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke tagihan ini.'
            ], 403);
        }

        if ($bill->status === 'paid') {
            return response()->json([
                'message' => 'Tagihan ini sudah lunas.'
            ], 422);
        }

        $message = $request->input(
            'message',
            'Pengingat pembayaran tagihan ' . $bill->period .
            ' sebesar Rp' . number_format($bill->amount, 0, ',', '.') .
            '. Jatuh tempo: ' . $bill->due_date->format('d-m-Y') . '.'
        );

        $reminder = BillReminder::create([
            'bill_id' => $bill->id,
            'message' => $message,
            'sent_at' => now(),
        ]);

        // Cari FCM token milik penghuni

        $deviceToken = DeviceToken::where(
            'user_id',
            $bill->tenant->user_id
        )
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
        ->first();


        if (!$deviceToken) {
            return response()->json([
                'message' => 'Penagihan berhasil dicatat, tetapi perangkat penghuni belum terdaftar untuk notifikasi.',
                'data' => $reminder->load(
                    'bill.tenant.user:id,name,nik'
                )
            ], 201);
        }

        // Kirim notifikasi ke HP penghuni
        try {
            app(FirebaseNotificationService::class)->sendToToken(
                $deviceToken->token,
                'Pengingat Tagihan Kostify',
                $message
            );
        } catch (\Throwable $e) {

            \Log::error('Gagal mengirim FCM reminder', [
                'bill_id' => $bill->id,
                'user_id' => $bill->tenant->user_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Penagihan berhasil dicatat, tetapi notifikasi gagal dikirim.',
                'data' => $reminder->load(
                    'bill.tenant.user:id,name,nik'
                )
            ], 201);
        }

        return response()->json([
            'message' => 'Penagihan berhasil dicatat.',
            'data' => $reminder->load(
                'bill.tenant.user:id,name,nik'
            )
        ], 201);
    }

    public function complaints(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($user->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        $kostIds = Kost::where('owner_id', $user->id)
            ->pluck('id');

        $complaints = Complaint::whereHas('tenant', function ($query) use ($kostIds) {
                $query->whereIn('kost_id', $kostIds);
            })
            ->with([
                'tenant.user:id,name,nik',
                'tenant.kost:id,name',
                'tenant.room:id,room_number'
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data komplain berhasil diambil.',
            'data' => $complaints
        ]);
    }

     public function storeTenant(Request $request)
    {
        $owner = $request->user();

        if (!$owner) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if ($owner->role !== 'owner') {
            return response()->json([
                'message' => 'Akses hanya untuk Pemilik Kos.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => 'required|string|max:50|unique:users,nik',
            'password' => 'required|string|min:8',
            'room_id' => 'required|exists:rooms,id',
            'phone' => 'required|string|max:30',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Cari kamar yang dipilih
        |--------------------------------------------------------------------------
        */

        $room = Room::with('kost')
            ->where('id', $validated['room_id'])
            ->first();

        if (!$room) {
            return response()->json([
                'message' => 'Kamar tidak ditemukan.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Pastikan kamar memang milik Owner yang sedang login
        |--------------------------------------------------------------------------
        */

        if (!$room->kost || $room->kost->owner_id !== $owner->id) {
            return response()->json([
                'message' => 'Kamar tersebut bukan milik Anda.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Pastikan kamar masih tersedia
        |--------------------------------------------------------------------------
        */

        if ($room->status !== 'available') {
            return response()->json([
                'message' => 'Kamar tersebut sudah tidak tersedia.'
            ], 422);
        }

        DB::beginTransaction();

        try {

            /*
            |--------------------------------------------------------------------------
            | Buat akun Tenant
            |--------------------------------------------------------------------------
            */

            $user = User::create([
                'name' => $validated['name'],
                'nik' => $validated['nik'],
                'password' => Hash::make($validated['password']),
                'role' => 'tenant',
                'status' => $validated['status'],
            ]);

            /*
            |--------------------------------------------------------------------------
            | Buat data Tenant
            |--------------------------------------------------------------------------
            */

            $tenant = Tenant::create([
                'user_id' => $user->id,
                'kost_id' => $room->kost_id,
                'room_id' => $room->id,
                'phone' => $validated['phone'],
                'address' => $validated['address'] ?? null,
                'status' => $validated['status'],
            ]);

            /*
            |--------------------------------------------------------------------------
            | Kamar otomatis menjadi occupied
            |--------------------------------------------------------------------------
            */

            $room->update([
                'status' => 'occupied'
            ]);

            DB::commit();

            $tenant->load([
                'user:id,name,nik,status',
                'kost:id,name',
                'room:id,room_number,price,status'
            ]);

            return response()->json([
                'message' => 'Penghuni berhasil ditambahkan.',
                'data' => $tenant
            ], 201);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menambahkan penghuni.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}