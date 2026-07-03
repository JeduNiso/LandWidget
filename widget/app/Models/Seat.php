<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seat extends Model
{
    use HasFactory;

    protected $fillable = ['schedule_id', 'seat_number', 'deck', 'is_reserved'];

    protected $casts = [
        'is_reserved' => 'boolean',
    ];

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function passenger()
    {
        return $this->hasOne(Passenger::class);
    }
}
