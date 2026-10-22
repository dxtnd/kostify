<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.'
            ], 401);
        }

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Akun bukan Super Admin.'
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Akun Super Admin tidak aktif.'
            ], 403);
        }

        $token = $user->createToken('super-admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.'
        ]);
    }

    public function ownerLogin(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])
            ->where('role', 'owner')
            ->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.'
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Akun Pemilik Kos tidak aktif.'
            ], 403);
        }

        $token = $user->createToken('owner-token')->plainTextToken;

        return response()->json([
            'message' => 'Login Pemilik Kos berhasil.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
            'token' => $token,
        ]);
    }

    public function tenantLogin(Request $request)
    {
        $credentials = $request->validate([
            'nik' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('nik', $credentials['nik'])
            ->where('role', 'tenant')
            ->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'NIK atau password salah.'
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Akun Anak Kos tidak aktif.'
            ], 403);
        }

        // Ambil data tenant berdasarkan user yang sedang login
        $tenant = Tenant::with([
            'kost:id,name',
            'room:id,room_number'
        ])
        ->where('user_id', $user->id)
        ->first();

        if (!$tenant) {
            return response()->json([
                'message' => 'Data Anak Kos tidak ditemukan.'
            ], 404);
        }

        $token = $user->createToken('tenant-token')->plainTextToken;

        return response()->json([
            'message' => 'Login Anak Kos berhasil.',

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'nik' => $user->nik,
                'role' => $user->role,
                'status' => $user->status,
            ],

            'tenant' => [
                'id' => $tenant->id,

                'kost' => $tenant->kost
                    ? [
                        'id' => $tenant->kost->id,
                        'name' => $tenant->kost->name,
                    ]
                    : null,

                'room' => $tenant->room
                    ? [
                        'id' => $tenant->room->id,
                        'room_number' => $tenant->room->room_number,
                    ]
                    : null,
            ],

            'token' => $token,
        ]);
    }
}