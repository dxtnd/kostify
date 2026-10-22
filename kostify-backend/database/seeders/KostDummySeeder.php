<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Kost;
use App\Models\Room;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class KostDummySeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::updateOrCreate(
            [
                'email' => 'owner@kostify.com',
            ],
            [
                'name' => 'Dandi Pemilik Kost',
                'password' => Hash::make('password123'),
                'role' => 'owner',
                'status' => 'active',
            ]
        );

        $kost = Kost::create([
            'owner_id' => $owner->id,
            'name' => 'Kost Dandi',
            'address' => 'Jl. Contoh No. 10',
            'city' => 'Sumedang',
            'status' => 'active',
        ]);

        Room::create([
            'kost_id' => $kost->id,
            'room_number' => 'A01',
            'price' => 750000,
            'status' => 'available',
        ]);

        Room::create([
            'kost_id' => $kost->id,
            'room_number' => 'A02',
            'price' => 750000,
            'status' => 'occupied',
        ]);

        Room::create([
            'kost_id' => $kost->id,
            'room_number' => 'A03',
            'price' => 800000,
            'status' => 'available',
        ]);
    }
}