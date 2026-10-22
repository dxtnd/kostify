<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Bill;
use App\Models\Complaint;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'kost_id',
        'room_id',
        'phone',
        'address',
        'identity_document',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kost()
    {
        return $this->belongsTo(Kost::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function complaints()
    {
        return $this->hasMany(Complaint::class);
    }
}