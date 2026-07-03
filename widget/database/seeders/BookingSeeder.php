<?php

namespace Database\Seeders;

use App\Models\Seat;
use App\Models\Schedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * BookingSeeder
 *
 * Simula el proceso completo de venta de pasajes en Bolivia:
 *   - Horarios pasados (últimos 7 días): 45-88% de ocupación confirmada.
 *   - Horarios de hoy y próximos 7 días: 8-48% vendido (pre-venta).
 *   - Nombres, apellidos y CI bolivianos reales.
 *   - Teléfonos bolivianos (+591 6/7xxxxxxx).
 *   - Correos con dominios locales e internacionales.
 *   - Distribución realista de grupos: 50% solo, 30% pareja, 12% trío, 8% cuarteto.
 *   - Estados: 78% confirmado, 13% pendiente, 9% cancelado.
 *
 * Todo el proceso corre dentro de una sola transacción SQLite
 * para máximo rendimiento.
 */
class BookingSeeder extends Seeder
{
    // -----------------------------------------------------------------------
    // Datos personales bolivianos
    // -----------------------------------------------------------------------

    private array $maleNames = [
        'Carlos', 'Juan', 'Miguel', 'Luis', 'José', 'Roberto', 'Pedro', 'Fernando',
        'Diego', 'Andrés', 'Sergio', 'Marco', 'Víctor', 'David', 'Gabriel', 'Ricardo',
        'Alejandro', 'Rodrigo', 'Eduardo', 'Gustavo', 'Pablo', 'Javier', 'Marcelo',
        'Álvaro', 'Raúl', 'Hugo', 'Óscar', 'Ramón', 'Héctor', 'Jorge', 'Nelson',
        'Freddy', 'Rolando', 'Wilmer', 'René', 'Boris', 'Erick', 'Iván', 'Dante',
        'Armando', 'Cristian', 'Felipe', 'Gonzalo', 'Hernán', 'Ignacio', 'Kevin',
    ];

    private array $femaleNames = [
        'María', 'Ana', 'Carmen', 'Rosa', 'Patricia', 'Elena', 'Gabriela', 'Sandra',
        'Claudia', 'Jessica', 'Daniela', 'Fernanda', 'Valentina', 'Paola', 'Andrea',
        'Mónica', 'Lucía', 'Isabel', 'Sofía', 'Carla', 'Verónica', 'Natalia',
        'Cecilia', 'Lorena', 'Adriana', 'Beatriz', 'Ximena', 'Fabiola', 'Yolanda',
        'Jimena', 'Karina', 'Magaly', 'Lidia', 'Rosario', 'Rebeca', 'Alicia',
        'Shirley', 'Gisela', 'Norma', 'Pilar', 'Sabrina', 'Tamara', 'Ursula',
    ];

    /** Apellidos comunes en Bolivia (andinos, mestizos, criollos) */
    private array $lastNames = [
        'Mamani', 'Condori', 'Quispe', 'Flores', 'García', 'López', 'Rodríguez',
        'Mendoza', 'Vargas', 'Cruz', 'Huanca', 'Copa', 'Apaza', 'Choque', 'Calizaya',
        'Gutiérrez', 'Morales', 'Aguilar', 'Ramos', 'Torres', 'Salinas', 'Miranda',
        'Castro', 'Rojas', 'Vega', 'Luna', 'Ortiz', 'Suárez', 'Molina', 'Silva',
        'Soria', 'Alanoca', 'Poma', 'Nina', 'Tarqui', 'Colque', 'Limachi', 'Marca',
        'Yucra', 'Villca', 'Larico', 'Hilari', 'Ticona', 'Machaca', 'Callisaya',
        'Catari', 'Gonzales', 'Herrera', 'Llanque', 'Navia', 'Farfán', 'Espejo',
        'Ibáñez', 'Jiménez', 'Aruquipa', 'Cusi', 'Ccopa', 'Oporto', 'Paco',
        'Chávez', 'Delgado', 'Pereira', 'Alarcón', 'Baldivieso', 'Centellas',
        'Durán', 'Ferrufino', 'Gómez', 'Herbas', 'Illanes', 'Justiniano',
    ];

    /** Departamentos de Bolivia para el sufijo del CI */
    private array $departments = ['LP', 'SC', 'CB', 'OR', 'PT', 'CH', 'TJ', 'BN', 'PD'];

    private array $emailProviders = [
        'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com',
        'entel.bo', 'tigo.bo', 'viva.bo',
    ];

    /** Mapa de tildes → ASCII para construir emails */
    private array $accentMap = [
        'á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ü'=>'u','ñ'=>'n',
        'Á'=>'A','É'=>'E','Í'=>'I','Ó'=>'O','Ú'=>'U','Ü'=>'U','Ñ'=>'N',
    ];

    // -----------------------------------------------------------------------
    // Punto de entrada
    // -----------------------------------------------------------------------

    public function run()
    {
        $now = now();

        // Una sola transacción = SQLite escribe todo de una vez (100x más rápido)
        DB::beginTransaction();

        try {
            // --- Horarios PASADOS: alta ocupación (ventas completadas) ------
            $pastSchedules = Schedule::with('seats')
                ->where('departure_at', '<', $now->copy()->startOfDay())
                ->get();

            $this->command->info("  > Horarios pasados:  {$pastSchedules->count()}");

            foreach ($pastSchedules as $schedule) {
                // Fin de semana tiene más pasajeros
                $dow     = (int) date('N', strtotime($schedule->departure_at));
                $weekend = $dow >= 5;
                $min     = $weekend ? 0.60 : 0.45;
                $max     = $weekend ? 0.88 : 0.78;
                $this->fillSchedule($schedule, $min, $max, 'confirmed');
            }

            // --- Horarios FUTUROS: pre-venta --------------------------------
            $futureSchedules = Schedule::with('seats')
                ->where('departure_at', '>=', $now->copy()->startOfDay())
                ->where('departure_at', '<=', $now->copy()->addDays(7))
                ->get();

            $this->command->info("  > Horarios próximos: {$futureSchedules->count()}");

            foreach ($futureSchedules as $schedule) {
                $dow     = (int) date('N', strtotime($schedule->departure_at));
                $weekend = $dow >= 5;
                $min     = $weekend ? 0.18 : 0.05;
                $max     = $weekend ? 0.45 : 0.25;
                $this->fillSchedule($schedule, $min, $max, null);
            }

            DB::commit();

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    // -----------------------------------------------------------------------
    // Rellena un horario con reservas simuladas
    // -----------------------------------------------------------------------

    private function fillSchedule(Schedule $schedule, float $min, float $max, ?string $forceStatus): void
    {
        $freeSeats = $schedule->seats->where('is_reserved', false)->values();
        if ($freeSeats->isEmpty()) return;

        $rate     = $min + (mt_rand(0, 1000) / 1000) * ($max - $min);
        $toFill   = max(0, (int) round($freeSeats->count() * $rate));
        $shuffled = $freeSeats->shuffle();
        $cursor   = 0;

        $passengerRows   = [];
        $reservedSeatIds = [];

        while ($cursor < $toFill) {
            $maxGroup  = min(4, $toFill - $cursor);
            $groupSize = $this->pickGroupSize($maxGroup);
            $group     = $shuffled->slice($cursor, $groupSize)->values();
            if ($group->isEmpty()) break;

            $status   = $forceStatus ?? $this->randomStatus();
            $bookedAt = $this->randomBookedAt($schedule->departure_at);

            $contactFirst = $this->randomName();
            $contactLast  = $this->randomLastName();

            // Insertar reserva y obtener ID (una fila a la vez, rápido en transacción)
            $bookingId = DB::table('bookings')->insertGetId([
                'booking_code'  => strtoupper(Str::random(8)),
                'schedule_id'   => $schedule->id,
                'contact_name'  => "{$contactFirst} {$contactLast}",
                'contact_email' => $this->buildEmail($contactFirst, $contactLast),
                'contact_phone' => $this->randomPhone(),
                'total_amount'  => round($schedule->price * $group->count(), 2),
                'status'        => $status,
                'created_at'    => $bookedAt,
                'updated_at'    => $bookedAt,
            ]);

            foreach ($group as $seat) {
                $passengerRows[] = [
                    'booking_id'      => $bookingId,
                    'seat_id'         => $seat->id,
                    'first_name'      => $this->randomName(),
                    'last_name'       => $this->randomLastName(),
                    'document_type'   => 'CI',
                    'document_number' => $this->randomCI(),
                    'created_at'      => $bookedAt,
                    'updated_at'      => $bookedAt,
                ];

                if ($status === 'confirmed') {
                    $reservedSeatIds[] = $seat->id;
                }
            }

            // Volcar pasajeros en lotes de 500 para no saturar memoria
            if (count($passengerRows) >= 500) {
                DB::table('passengers')->insert($passengerRows);
                $passengerRows = [];
            }

            $cursor += $groupSize;
        }

        // Vaciar buffer final de pasajeros
        if (!empty($passengerRows)) {
            DB::table('passengers')->insert($passengerRows);
        }

        // Marcar asientos como reservados en lotes
        foreach (array_chunk($reservedSeatIds, 1000) as $chunk) {
            Seat::whereIn('id', $chunk)->update(['is_reserved' => true]);
        }
    }

    // -----------------------------------------------------------------------
    // Helpers de generación aleatoria
    // -----------------------------------------------------------------------

    /**
     * Distribución realista de tamaño de grupo:
     * 50% solo, 30% pareja, 12% trío, 8% cuarteto.
     */
    private function pickGroupSize(int $max): int
    {
        $weights = [50, 30, 12, 8];
        $rand    = mt_rand(1, 100);
        $accum   = 0;
        for ($i = 0; $i < $max; $i++) {
            $accum += $weights[$i];
            if ($rand <= $accum) return $i + 1;
        }
        return $max;
    }

    /** 78% confirmado · 13% pendiente · 9% cancelado */
    private function randomStatus(): string
    {
        $r = mt_rand(1, 100);
        if ($r <= 78) return 'confirmed';
        if ($r <= 91) return 'pending';
        return 'cancelled';
    }

    /**
     * Fecha de compra aleatoria entre 30 días antes de la salida
     * y 1 hora antes de esta, nunca en el futuro.
     */
    private function randomBookedAt(string $departureAt): string
    {
        $dep      = strtotime($departureAt);
        $now      = time();
        $earliest = max($dep - 30 * 86400, mktime(0, 0, 0, 1, 1, 2026));
        $latest   = min($dep - 3600, $now);
        if ($earliest >= $latest) {
            return date('Y-m-d H:i:s', max($earliest, $dep - 86400));
        }
        return date('Y-m-d H:i:s', mt_rand($earliest, $latest));
    }

    private function randomName(): string
    {
        $pool = mt_rand(0, 1) ? $this->maleNames : $this->femaleNames;
        return $pool[array_rand($pool)];
    }

    private function randomLastName(): string
    {
        return $this->lastNames[array_rand($this->lastNames)];
    }

    /**
     * Email estilo boliviano: usa dominios locales y patrón nombre.apellido
     * o variantes con número. Elimina tildes con mapa propio (sin iconv).
     */
    private function buildEmail(string $first, string $last): string
    {
        $f = strtolower(preg_replace(
            '/[^a-zA-Z0-9]/', '',
            strtr($first, $this->accentMap)
        ));
        $l = strtolower(preg_replace(
            '/[^a-zA-Z0-9]/', '',
            strtr($last, $this->accentMap)
        ));
        $provider = $this->emailProviders[array_rand($this->emailProviders)];
        $patterns = [
            "{$f}.{$l}",
            "{$f}" . mt_rand(10, 999),
            "{$l}." . substr($f, 0, 1),
            substr($f, 0, 3) . $l,
            "{$f}_{$l}" . mt_rand(1, 99),
        ];
        return $patterns[array_rand($patterns)] . '@' . $provider;
    }

    /**
     * Teléfono boliviano: +591 seguido de 6 o 7 (operadoras móviles) y 7 dígitos.
     * Ej: +591 71234567 (Tigo), +591 69876543 (Entel)
     */
    private function randomPhone(): string
    {
        $prefix = mt_rand(0, 1) ? '6' : '7';
        return '+591 ' . $prefix . mt_rand(1000000, 9999999);
    }

    /**
     * CI boliviana: 7 dígitos + código de departamento.
     * Ej: 5234871 LP
     */
    private function randomCI(): string
    {
        $number = mt_rand(1000000, 9999999);
        $dept   = $this->departments[array_rand($this->departments)];
        return "{$number} {$dept}";
    }
}
