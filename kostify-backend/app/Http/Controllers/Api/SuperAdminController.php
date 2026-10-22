<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\Kost;
use App\Models\Room;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    public function overview(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $totalOwners = User::where('role', 'owner')->count();

        $totalKosts = Kost::count();

        $totalRooms = Room::count();

        $recentOwners = User::where('role', 'owner')
            ->with('kosts')
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'message' => 'Data Global Overview berhasil diambil.',

            'statistics' => [
                'total_owners' => $totalOwners,
                'total_kosts' => $totalKosts,
                'total_rooms' => $totalRooms,
            ],

            'recent_owners' => $recentOwners,
        ]);
    }

    public function owners(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $owners = User::where('role', 'owner')
            ->with('kosts')
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data pemilik kos berhasil diambil.',
            'data' => $owners
        ]);
    }

    public function updateOwnerStatus(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $owner = User::where('role', 'owner')->find($id);

        if (!$owner) {
            return response()->json([
                'message' => 'Pemilik kos tidak ditemukan.'
            ], 404);
        } 

        $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $owner->status = $request->status;
        $owner->save();

        return response()->json([
            'message' => 'Status pemilik kos berhasil diperbarui.',
            'data' => [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
                'role' => $owner->role,
                'status' => $owner->status,
            ]
        ]);
    }

    public function deleteOwner(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $owner = User::where('role', 'owner')->find($id);

        if (!$owner) {
            return response()->json([
                'message' => 'Pemilik kos tidak ditemukan.'
            ], 404);
        }

        $owner->delete();

        return response()->json([
            'message' => 'Akun pemilik kos berhasil dihapus.'
        ]);
    }

    public function kosts(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $kosts = Kost::with('owner')
            ->withCount('rooms')
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data kost berhasil diambil.',
            'data' => $kosts
        ]);
    }

    public function storeKost(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $validated = $request->validate([
            'owner_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        $owner = User::where('id', $validated['owner_id'])
            ->where('role', 'owner')
            ->first();

        if (!$owner) {
            return response()->json([
                'message' => 'User yang dipilih bukan Pemilik Kos.'
            ], 422);
        }

        $kost = Kost::create([
            'owner_id' => $owner->id,
            'name' => $validated['name'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Data kost berhasil ditambahkan.',
            'data' => $kost
        ], 201);
    }

    public function updateKost(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $kost = Kost::find($id);

        if (!$kost) {
            return response()->json([
                'message' => 'Data kost tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate([
            'owner_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        $owner = User::where('id', $validated['owner_id'])
            ->where('role', 'owner')
            ->first();

        if (!$owner) {
            return response()->json([
                'message' => 'User yang dipilih bukan Pemilik Kos.'
            ], 422);
        }

        $kost->update([
            'owner_id' => $validated['owner_id'],
            'name' => $validated['name'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Data kost berhasil diperbarui.',
            'data' => $kost
        ]);
    }

    public function deleteKost(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $kost = Kost::find($id);

        if (!$kost) {
            return response()->json([
                'message' => 'Data kost tidak ditemukan.'
            ], 404);
        }

        $kost->delete();

        return response()->json([
            'message' => 'Data kost berhasil dihapus.'
        ]);
    }

    public function monitoringOwners(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $owners = User::where('role', 'owner')
            ->select([
                'id',
                'name',
                'email',
                'status',
                'created_at'
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data pemilik kos berhasil diambil.',
            'data' => $owners
        ]);
    }

    public function monitoringKosts(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $kosts = Kost::with('owner:id,name,email')
            ->select([
                'id',
                'owner_id',
                'name',
                'address',
                'city',
                'status',
                'created_at'
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Data kost terdaftar berhasil diambil.',
            'data' => $kosts
        ]);
    }

    public function storeOwner(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'status' => 'nullable|in:active,inactive',
        ]);

        $owner = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'owner',
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Pemilik Kos berhasil ditambahkan.',
            'data' => [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
                'role' => $owner->role,
                'status' => $owner->status,
            ]
        ], 201);
    }

    
}