<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }

        DB::table('passengers')->truncate();
        DB::table('bookings')->truncate();
        DB::table('seats')->truncate();
        DB::table('schedules')->truncate();
        DB::table('bus_routes')->truncate();
        DB::table('cities')->truncate();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        $this->call([
            BusSeeder::class,      // ciudades, rutas, horarios, asientos
            BookingSeeder::class,  // reservas y pasajeros simulados
            SeguenceSeeder::class, // valor inicial de seguence para pagos
        ]);
    }
}
