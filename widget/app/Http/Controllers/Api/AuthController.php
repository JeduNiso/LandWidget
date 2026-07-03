<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\OtpPasswordResetNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── Register ──────────────────────────────────────────────────────────

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    // ── Login ─────────────────────────────────────────────────────────────

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son incorrectas.'],
            ]);
        }

        // Revoke previous tokens if not "remember me"
        if (! $request->boolean('remember')) {
            $user->tokens()->delete();
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    // ── Logout ────────────────────────────────────────────────────────────

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    // ── Get authenticated user ────────────────────────────────────────────

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    // ── Update profile ────────────────────────────────────────────────────

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->only(['name', 'email', 'phone']);

        if ($request->hasFile('profile_photo')) {
            // Delete old photo
            if ($user->profile_photo) {
                Storage::disk('public')->delete($user->profile_photo);
            }
            $data['profile_photo'] = $request
                ->file('profile_photo')
                ->store('profile-photos', 'public');
        }

        $user->update($data);

        return response()->json($user->fresh());
    }

    // ── Change password ───────────────────────────────────────────────────

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['La contraseña actual es incorrecta.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // Revoke all tokens (force re-login with new password)
        $user->tokens()->delete();
        $newToken = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message' => 'Contraseña actualizada correctamente.',
            'token'   => $newToken,
        ]);
    }

    // ── Forgot password (send OTP) ────────────────────────────────────────

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        // Generate 6-digit OTP
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Upsert OTP record (replace any existing one for this email)
        DB::table('password_otps')->updateOrInsert(
            ['email' => $request->email],
            [
                'otp'        => Hash::make($otp),
                'expires_at' => now()->addMinutes(15),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Send notification
        $user->notify(new OtpPasswordResetNotification($otp, $user->name));

        return response()->json([
            'message' => 'Te enviamos un código de verificación a tu correo.',
        ]);
    }

    // ── Reset password (validate OTP + set new password) ─────────────────

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $record = DB::table('password_otps')
            ->where('email', $request->email)
            ->first();

        if (
            ! $record ||
            ! Hash::check($request->otp, $record->otp) ||
            now()->isAfter($record->expires_at)
        ) {
            throw ValidationException::withMessages([
                'otp' => ['El código es inválido o ha expirado. Solicitá uno nuevo.'],
            ]);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $user->update(['password' => Hash::make($request->password)]);

        // Clean up OTP record
        DB::table('password_otps')->where('email', $request->email)->delete();

        // Revoke old tokens
        $user->tokens()->delete();

        return response()->json(['message' => 'Contraseña restablecida correctamente.']);
    }

    // ── User bookings ─────────────────────────────────────────────────────

    public function bookings(Request $request): JsonResponse
    {
        // Reuse the Booking model (already in project)
        // Adapt based on actual Booking schema
        $bookings = \App\Models\Booking::where('contact_email', $request->user()->email)
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($bookings);
    }
}
