<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();

            // Akun Anak Kos
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Kost tempat Anak Kos tinggal
            $table->foreignId('kost_id')
                ->constrained('kosts')
                ->cascadeOnDelete();

            // Kamar yang ditempati
            $table->foreignId('room_id')
                ->constrained('rooms')
                ->cascadeOnDelete();

            $table->string('phone');
            $table->text('address')->nullable();
            $table->string('identity_document')->nullable();

            $table->enum('status', [
                'active',
                'inactive'
            ])->default('active');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
