<?php

namespace Database\Seeders;

use App\Models\BusRoute;
use App\Models\City;
use App\Models\Schedule;
use App\Models\Seat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BusSeeder extends Seeder
{
    /**
     * Empresas de buses bolivianas reales con tipo y capacidad.
     * factor: multiplicador sobre el precio base de la ruta.
     */
    private array $companies = [
        ['name' => 'Bolivia Bus',       'type' => 'cama',       'seats' => 20, 'factor' => 2.00],
        ['name' => 'Expreso del Sur',   'type' => 'cama',       'seats' => 24, 'factor' => 1.80],
        ['name' => 'Andina Bus',        'type' => 'cama',       'seats' => 24, 'factor' => 1.75],
        ['name' => 'Trans Copacabana',  'type' => 'semi-cama',  'seats' => 36, 'factor' => 1.30],
        ['name' => 'Marina Bus',        'type' => 'semi-cama',  'seats' => 32, 'factor' => 1.20],
        ['name' => 'Flota Bustillo',    'type' => 'semi-cama',  'seats' => 36, 'factor' => 1.15],
        ['name' => 'Trans Plus Ultra',  'type' => 'semi-cama',  'seats' => 32, 'factor' => 1.20],
        ['name' => 'Trans Marka',       'type' => 'ejecutivo',  'seats' => 44, 'factor' => 1.00],
        ['name' => 'Flota Ingavi',      'type' => 'ejecutivo',  'seats' => 44, 'factor' => 1.00],
        ['name' => 'Trans Yungas',      'type' => 'ejecutivo',  'seats' => 44, 'factor' => 0.90],
    ];

    public function run()
    {
        $this->seedCities();
        $this->seedRoutes();
    }

    // -----------------------------------------------------------------------
    // Ciudades principales de Bolivia
    // -----------------------------------------------------------------------
    private function seedCities(): void
    {
        $cities = [
            ['name' => 'La Paz',     'code' => 'LPZ'],
            ['name' => 'Santa Cruz', 'code' => 'SCZ'],
            ['name' => 'Cochabamba', 'code' => 'CBB'],
            ['name' => 'Oruro',      'code' => 'ORU'],
            ['name' => 'Potosí',     'code' => 'POT'],
            ['name' => 'Sucre',      'code' => 'SUC'],
            ['name' => 'Tarija',     'code' => 'TJA'],
            ['name' => 'Trinidad',   'code' => 'TDD'],
            ['name' => 'El Alto',    'code' => 'EAL'],
        ];

        foreach ($cities as $city) {
            City::firstOrCreate(['code' => $city['code']], $city);
        }
    }

    // -----------------------------------------------------------------------
    // Rutas principales de Bolivia con precios en Bolivianos (Bs.)
    // [origen, destino, precio_base_Bs, duracion_minutos]
    // -----------------------------------------------------------------------
    private function seedRoutes(): void
    {
        $c = City::all()->keyBy('code');

        $routes = [
            // La Paz ↔ principales ciudades
            ['LPZ', 'SCZ',  1.00,  720],   // ~12h vía Cochabamba
            ['SCZ', 'LPZ',  75.00,  720],
            ['LPZ', 'CBB',  28.00,  420],   // ~7h
            ['CBB', 'LPZ',  28.00,  420],
            ['LPZ', 'ORU',  18.00,  210],   // ~3.5h
            ['ORU', 'LPZ',  18.00,  210],
            ['LPZ', 'POT',  40.00,  480],   // ~8h
            ['POT', 'LPZ',  40.00,  480],
            ['LPZ', 'SUC',  55.00,  660],   // ~11h
            ['SUC', 'LPZ',  55.00,  660],
            ['LPZ', 'TJA',  90.00,  960],   // ~16h
            ['TJA', 'LPZ',  90.00,  960],
            ['LPZ', 'TDD',  85.00,  960],   // ~16h vía carretera norte
            ['TDD', 'LPZ',  85.00,  960],
            // El Alto (conectado a La Paz, rutas propias desde terminal)
            ['EAL', 'SCZ',  70.00,  720],
            ['SCZ', 'EAL',  70.00,  720],
            ['EAL', 'CBB',  25.00,  420],
            ['CBB', 'EAL',  25.00,  420],
            // Santa Cruz ↔ otras ciudades
            ['SCZ', 'CBB',  42.00,  540],   // ~9h
            ['CBB', 'SCZ',  42.00,  540],
            ['SCZ', 'SUC',  45.00,  600],   // ~10h
            ['SUC', 'SCZ',  45.00,  600],
            ['SCZ', 'TJA',  65.00,  720],   // ~12h
            ['TJA', 'SCZ',  65.00,  720],
            // Cochabamba ↔ otras ciudades
            ['CBB', 'ORU',  22.00,  210],   // ~3.5h
            ['ORU', 'CBB',  22.00,  210],
            ['CBB', 'SUC',  35.00,  420],   // ~7h
            ['SUC', 'CBB',  35.00,  420],
            ['CBB', 'TJA',  55.00,  720],   // ~12h
            ['TJA', 'CBB',  55.00,  720],
            // Oruro ↔ Potosí y Sucre
            ['ORU', 'POT',  28.00,  300],   // ~5h
            ['POT', 'ORU',  28.00,  300],
            // Potosí ↔ Sucre
            ['POT', 'SUC',  22.00,  180],   // ~3h
            ['SUC', 'POT',  22.00,  180],
            // Oruro ↔ Sucre y Tarija
            ['ORU', 'SUC',  35.00,  360],   // ~6h
            ['SUC', 'ORU',  35.00,  360],
            ['ORU', 'TJA',  65.00,  720],   // ~12h
            ['TJA', 'ORU',  65.00,  720],
            // Potosí ↔ Cochabamba y Tarija
            ['POT', 'CBB',  30.00,  360],   // ~6h
            ['CBB', 'POT',  30.00,  360],
            ['POT', 'TJA',  50.00,  480],   // ~8h
            ['TJA', 'POT',  50.00,  480],
            // Tarija ↔ Sucre
            ['TJA', 'SUC',  45.00,  540],   // ~9h
            ['SUC', 'TJA',  45.00,  540],
            // Trinidad ↔ Santa Cruz y Cochabamba
            ['TDD', 'SCZ',  60.00,  600],   // ~10h
            ['SCZ', 'TDD',  60.00,  600],
            ['TDD', 'CBB',  80.00,  840],   // ~14h
            ['CBB', 'TDD',  80.00,  840],
            // El Alto ↔ ciudades del sur
            ['EAL', 'ORU',  15.00,  180],   // ~3h
            ['ORU', 'EAL',  15.00,  180],
            ['EAL', 'POT',  38.00,  480],   // ~8h
            ['POT', 'EAL',  38.00,  480],
            ['EAL', 'SUC',  52.00,  660],   // ~11h
            ['SUC', 'EAL',  52.00,  660],
            ['EAL', 'TJA',  85.00,  960],   // ~16h
            ['TJA', 'EAL',  85.00,  960],
            ['EAL', 'TDD',  82.00,  960],   // ~16h
            ['TDD', 'EAL',  82.00,  960],
        ];

        foreach ($routes as [$originCode, $destCode, $price, $duration]) {
            $origin = $c[$originCode] ?? null;
            $dest   = $c[$destCode]   ?? null;
            if (!$origin || !$dest) continue;

            $route = BusRoute::firstOrCreate(
                ['origin_city_id' => $origin->id, 'destination_city_id' => $dest->id],
                ['base_price' => $price, 'duration_minutes' => $duration, 'active' => true]
            );

            $fixedPrice = ($originCode === 'LPZ' && $destCode === 'SCZ') ? 1.00 : null;
            $this->createSchedules($route, $fixedPrice);
        }
    }

    // -----------------------------------------------------------------------
    // Horarios: last 7 days + today + next 14 days = 22 days
    // Rutas largas (>= 600 min): salidas nocturnas (3 por día)
    // Rutas cortas/medias: múltiples salidas (4 por día)
    // -----------------------------------------------------------------------
    private function createSchedules(BusRoute $route, ?float $fixedPrice = null): void
    {
        $times = $route->duration_minutes >= 600
            ? ['19:00', '20:30', '22:00']          // larga distancia: nocturno
            : ['06:30', '09:00', '14:30', '20:00']; // media/corta: varios turnos

        for ($day = -7; $day <= 14; $day++) {
            $date = now()->addDays($day)->format('Y-m-d');

            foreach ($times as $time) {
                $company     = $this->companies[array_rand($this->companies)];
                $departureAt = "{$date} {$time}:00";

                $exists = Schedule::where('bus_route_id', $route->id)
                    ->where('departure_at', $departureAt)
                    ->exists();

                if ($exists) continue;

                $schedule = Schedule::create([
                    'bus_route_id' => $route->id,
                    'bus_name'     => $company['name'],
                    'bus_type'     => $company['type'],
                    'total_seats'  => $company['seats'],
                    'departure_at' => $departureAt,
                    'arrival_at'   => date('Y-m-d H:i:s', strtotime($departureAt) + $route->duration_minutes * 60),
                    'price'        => $fixedPrice ?? round($route->base_price * $company['factor'], 2),
                    'active'       => true,
                ]);

                $this->createSeats($schedule);
            }
        }
    }

    // -----------------------------------------------------------------------
    // Asientos: cama tiene piso superior (U) e inferior; resto solo inferior.
    // Usa batch insert para rendimiento.
    // -----------------------------------------------------------------------
    private function createSeats(Schedule $schedule): void
    {
        $total  = $schedule->total_seats;
        $isCama = $schedule->bus_type === 'cama';
        $rows   = [];
        $ts     = now()->toDateTimeString();

        if ($isCama) {
            $lower = (int) ceil($total / 2);
            $upper = $total - $lower;
            for ($i = 1; $i <= $lower; $i++) {
                $rows[] = ['schedule_id' => $schedule->id, 'seat_number' => (string) $i,   'deck' => 'lower', 'is_reserved' => 0, 'created_at' => $ts, 'updated_at' => $ts];
            }
            for ($i = 1; $i <= $upper; $i++) {
                $rows[] = ['schedule_id' => $schedule->id, 'seat_number' => 'U' . $i, 'deck' => 'upper', 'is_reserved' => 0, 'created_at' => $ts, 'updated_at' => $ts];
            }
        } else {
            for ($i = 1; $i <= $total; $i++) {
                $rows[] = ['schedule_id' => $schedule->id, 'seat_number' => (string) $i, 'deck' => 'lower', 'is_reserved' => 0, 'created_at' => $ts, 'updated_at' => $ts];
            }
        }

        DB::table('seats')->insert($rows);
    }
}
