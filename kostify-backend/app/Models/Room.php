<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Kost;
use App\Models\Tenant;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'kost_id',
        'room_number',
        'price',
        'status',
    ];

    public function kost()
    {
        return $this->belongsTo(Kost::class, 'kost_id');
    }

    public function tenant()
    {
        return $this->hasOne(Tenant::class);
    }
}