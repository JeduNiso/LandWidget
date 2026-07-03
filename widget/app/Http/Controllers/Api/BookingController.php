<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Passenger;
use App\Models\Seat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'schedule_id'                => 'required|integer|exists:schedules,id',
            'contact_name'               => 'required|string|max:100',
            'contact_email'              => 'required|email|max:150',
            'contact_phone'              => 'required|string|max:20',
            'passengers'                 => 'required|array|min:1',
            'passengers.*.seat_id'       => 'required|integer|exists:seats,id',
            'passengers.*.first_name'    => 'required|string|max:80',
            'passengers.*.last_name'     => 'required|string|max:80',
            'passengers.*.document_type' => 'required|in:CI,Pasaporte,CIE',
            'passengers.*.document_number' => 'required|string|max:30',
        ]);

        $seatIds = array_column($data['passengers'], 'seat_id');

        // Verify all seats belong to the schedule and are not reserved
        $seats = Seat::whereIn('id', $seatIds)
            ->where('schedule_id', $data['schedule_id'])
            ->get();

        if ($seats->count() !== count($seatIds)) {
            return response()->json(['message' => 'Uno o más asientos no pertenecen a este horario.'], 422);
        }

        $reservedSeats = $seats->filter(fn($s) => $s->is_reserved);
        if ($reservedSeats->isNotEmpty()) {
            $taken = $reservedSeats->pluck('seat_number')->join(', ');
            return response()->json(['message' => "Los asientos {$taken} ya están reservados."], 409);
        }

        $schedule = \App\Models\Schedule::findOrFail($data['schedule_id']);
        $total    = $schedule->price * count($data['passengers']);

        $booking = DB::transaction(function () use ($data, $seatIds, $total) {
            // Re-check inside transaction to prevent race conditions
            $locked = Seat::whereIn('id', $seatIds)
                ->lockForUpdate()
                ->where('is_reserved', false)
                ->count();

            if ($locked !== count($seatIds)) {
                throw new \Exception('SEATS_TAKEN');
            }

            $booking = Booking::create([
                'schedule_id'    => $data['schedule_id'],
                'contact_name'   => $data['contact_name'],
                'contact_email'  => $data['contact_email'],
                'contact_phone'  => $data['contact_phone'],
                'total_amount'   => $total,
                'status'         => 'pending',
            ]);

            foreach ($data['passengers'] as $p) {
                Passenger::create([
                    'booking_id'      => $booking->id,
                    'seat_id'         => $p['seat_id'],
                    'first_name'      => $p['first_name'],
                    'last_name'       => $p['last_name'],
                    'document_type'   => $p['document_type'],
                    'document_number' => $p['document_number'],
                ]);
            }

            Seat::whereIn('id', $seatIds)->update(['is_reserved' => true]);

            return $booking;
        });

        $booking->load(['passengers.seat', 'schedule.busRoute.originCity', 'schedule.busRoute.destinationCity']);

        return response()->json([
            'booking_code'    => $booking->booking_code,
            'status'          => $booking->status,
            'total_amount'    => (float) $booking->total_amount,
            'contact_email'   => $booking->contact_email,
            'origin'          => $booking->schedule->busRoute->originCity->name,
            'destination'     => $booking->schedule->busRoute->destinationCity->name,
            'departure_at'    => $booking->schedule->departure_at->toIso8601String(),
            'bus_name'        => $booking->schedule->bus_name,
            'seats'           => $booking->passengers->map(fn($p) => $p->seat->seat_number)->join(', '),
            'passengers_count' => $booking->passengers->count(),
        ], 201);
    }

    public function show(string $code): JsonResponse
    {
        $booking = Booking::where('booking_code', strtoupper($code))
            ->with(['passengers.seat', 'schedule.busRoute.originCity', 'schedule.busRoute.destinationCity'])
            ->firstOrFail();

        return response()->json([
            'booking_code'  => $booking->booking_code,
            'status'        => $booking->status,
            'total_amount'  => (float) $booking->total_amount,
            'contact_name'  => $booking->contact_name,
            'contact_email' => $booking->contact_email,
            'contact_phone' => $booking->contact_phone,
            'origin'        => $booking->schedule->busRoute->originCity->name,
            'destination'   => $booking->schedule->busRoute->destinationCity->name,
            'departure_at'  => $booking->schedule->departure_at->toIso8601String(),
            'arrival_at'    => $booking->schedule->arrival_at->toIso8601String(),
            'passengers'    => $booking->passengers->map(fn($p) => [
                'first_name'      => $p->first_name,
                'last_name'       => $p->last_name,
                'seat_number'     => $p->seat->seat_number,
                'document_type'   => $p->document_type,
                'document_number' => $p->document_number,
            ]),
        ]);
    }
}
