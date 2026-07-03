<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusRoute;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'origin_city_id'      => 'required|integer|exists:cities,id',
            'destination_city_id' => 'required|integer|exists:cities,id',
            'departure_date'      => 'required|date_format:Y-m-d',
            'passengers'          => 'sometimes|integer|min:1|max:10',
        ]);

        $date       = $request->input('departure_date');
        $passengers = (int) $request->input('passengers', 1);

        $schedules = Schedule::with(['busRoute.originCity', 'busRoute.destinationCity', 'seats'])
            ->whereHas('busRoute', function ($q) use ($request) {
                $q->where('origin_city_id', $request->origin_city_id)
                  ->where('destination_city_id', $request->destination_city_id)
                  ->where('active', true);
            })
            ->whereDate('departure_at', $date)
            ->where('active', true)
            ->get()
            ->filter(fn($s) => $s->available_seats_count >= $passengers)
            ->map(fn($s) => [
                'id'                   => $s->id,
                'bus_name'             => $s->bus_name,
                'bus_type'             => $s->bus_type,
                'departure_at'         => $s->departure_at->toIso8601String(),
                'arrival_at'           => $s->arrival_at->toIso8601String(),
                'price'                => (float) $s->price,
                'total_seats'          => $s->total_seats,
                'available_seats'      => $s->available_seats_count,
                'origin_city'          => $s->busRoute->originCity->name,
                'destination_city'     => $s->busRoute->destinationCity->name,
                'duration_minutes'     => $s->busRoute->duration_minutes,
            ])
            ->values();

        return response()->json($schedules);
    }

    public function seats(int $scheduleId): JsonResponse
    {
        $schedule = Schedule::with('seats')->findOrFail($scheduleId);

        $seats = $schedule->seats->map(fn($seat) => [
            'id'          => $seat->id,
            'seat_number' => $seat->seat_number,
            'deck'        => $seat->deck,
            'is_reserved' => $seat->is_reserved,
        ]);

        return response()->json([
            'schedule_id' => $scheduleId,
            'bus_type'    => $schedule->bus_type,
            'total_seats' => $schedule->total_seats,
            'seats'       => $seats,
        ]);
    }
}
