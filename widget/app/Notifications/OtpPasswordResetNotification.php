<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OtpPasswordResetNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $otp,
        private readonly string $name,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Código de recuperación — viajero.bo')
            ->greeting("Hola, {$this->name}!")
            ->line('Recibiste este email porque solicitaste restablecer tu contraseña.')
            ->line('Tu código de verificación es:')
            ->line('**' . $this->otp . '**')
            ->line('Este código expira en **15 minutos**.')
            ->line('Si no solicitaste este cambio, podés ignorar este email con seguridad.')
            ->salutation('El equipo de viajero.bo');
    }
}
