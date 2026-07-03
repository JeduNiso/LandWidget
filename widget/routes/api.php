<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
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

// ── Public bus routes ────────────────────────────────────────────────────

Route::get('/cities', [CityController::class, 'index']);
Route::get('/schedules/search', [ScheduleController::class, 'search']);
Route::get('/schedules/{schedule}/seats', [ScheduleController::class, 'seats']);

Route::post('/bookings', [BookingController::class, 'store']);
Route::get('/bookings/{code}', [BookingController::class, 'show']);
Route::post('/bookings/{code}/pay', [PaymentController::class, 'pay']);
Route::get('/bookings/{code}/enrollment-callback', [PaymentController::class, 'enrollment_callback']);
Route::post('/bookings/{code}/enrollment-result', [PaymentController::class, 'enrollment_result']);
Route::post('/bookings/{code}/pay-no-otp', [PaymentNoOtpController::class, 'pay']);

// ── Auth (public) ────────────────────────────────────────────────────────

Route::post('/register',        [AuthController::class, 'register']);
Route::post('/login',           [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);

// ── Auth (protected — requires Sanctum token) ────────────────────────────

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',         [AuthController::class, 'logout']);
    Route::get('/user',            [AuthController::class, 'me']);
    Route::post('/user/profile',   [AuthController::class, 'updateProfile']);
    Route::put('/user/password',   [AuthController::class, 'changePassword']);
    Route::get('/user/bookings',   [AuthController::class, 'bookings']);
});

