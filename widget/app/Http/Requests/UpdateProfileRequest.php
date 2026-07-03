<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255', 'min:2'],
            'email'         => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($this->user()->id),
            ],
            'phone'         => ['nullable', 'string', 'max:30'],
            'profile_photo' => ['nullable', 'image', 'max:5120', 'mimes:jpg,jpeg,png,webp'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'          => 'El nombre es obligatorio.',
            'email.required'         => 'El email es obligatorio.',
            'email.email'            => 'Ingresá un email válido.',
            'email.unique'           => 'Este email ya está en uso.',
            'profile_photo.image'    => 'El archivo debe ser una imagen.',
            'profile_photo.max'      => 'La imagen no puede superar 5MB.',
            'profile_photo.mimes'    => 'Formatos permitidos: JPG, PNG, WebP.',
        ];
    }
}
