<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'bus_route_id',
        'bus_name',
        'bus_type',
        'total_seats',
        'departure_at',
        'arrival_at',
        'price',
        'active',
    ];

    protected $casts = [
        'departure_at' => 'datetime',
        'arrival_at'   => 'datetime',
    ];

    public function busRoute()
    {
        return $this->belongsTo(BusRoute::class);
    }

    public function seats()
    {
        return $this->hasMany(Seat::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function getAvailableSeatsCountAttribute(): int
    {
        return $this->seats()->where('is_reserved', false)->count();
    }
}
