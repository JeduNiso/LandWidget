<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Desactivar FK para poder truncar en cualquier orden (SQLite)
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::table('passengers')->truncate();
        DB::table('bookings')->truncate();
        DB::table('seats')->truncate();
        DB::table('schedules')->truncate();
        DB::table('bus_routes')->truncate();
        DB::table('cities')->truncate();

        DB::statement('PRAGMA foreign_keys = ON');

        $this->call([
            BusSeeder::class,     // ciudades, rutas, horarios, asientos
            BookingSeeder::class, // reservas y pasajeros simulados
        ]);
    }
}
