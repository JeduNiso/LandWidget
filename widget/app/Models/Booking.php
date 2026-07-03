<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_code',
        'schedule_id',
        'contact_name',
        'contact_email',
        'contact_phone',
        'total_amount',
        'status',
        'cybersource_reference_id',
        'cybersource_payment_data',
    ];

    protected $casts = [
        'cybersource_payment_data' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($booking) {
            if (empty($booking->booking_code)) {
                $booking->booking_code = strtoupper(Str::random(8));
            }
        });
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function passengers()
    {
        return $this->hasMany(Passenger::class);
    }
}
