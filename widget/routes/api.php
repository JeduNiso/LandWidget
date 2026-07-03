<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CityController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentNoOtpController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Cities
Route::get('/cities', [CityController::class, 'index']);

// Search schedules
Route::get('/schedules/search', [ScheduleController::class, 'search']);
Route::get('/schedules/{schedule}/seats', [ScheduleController::class, 'seats']);

// Bookings
Route::post('/bookings', [BookingController::class, 'store']);
Route::get('/bookings/{code}', [BookingController::class, 'show']);
Route::post('/bookings/{code}/pay', [PaymentController::class, 'pay']);
Route::get('/bookings/{code}/enrollment-callback', [PaymentController::class, 'enrollment_callback']);
Route::post('/bookings/{code}/enrollment-result', [PaymentController::class, 'enrollment_result']);

// Payment without 3DS (test only)
Route::post('/bookings/{code}/pay-no-otp', [PaymentNoOtpController::class, 'pay']);
