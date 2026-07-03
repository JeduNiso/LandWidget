<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code'];

    public function originRoutes()
    {
        return $this->hasMany(BusRoute::class, 'origin_city_id');
    }

    public function destinationRoutes()
    {
        return $this->hasMany(BusRoute::class, 'destination_city_id');
    }
}
