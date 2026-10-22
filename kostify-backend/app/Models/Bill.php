<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\BillReminder;

class Bill extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'title',
        'amount',
        'due_date',
        'period',
        'status',
        'payment_proof',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function reminders()
    {
        return $this->hasMany(BillReminder::class);
    }
}