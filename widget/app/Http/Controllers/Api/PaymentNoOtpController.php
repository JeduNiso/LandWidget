<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;

class PaymentNoOtpController extends Controller
{
    public function pay(string $code, Request $request)
    {
         $data = $request->validate([
            'card_number'     => 'required|string',
            'cardholder_name' => 'required|string|max:100',
            'expiry_month'    => 'required|integer|min:1|max:12',
            'expiry_year'     => 'required|integer|min:2026',
            'cvv'             => 'required|string|min:3|max:4',
            'billing_first_name'        => 'nullable|string|max:60',
            'billing_last_name'         => 'nullable|string|max:60',
            'billing_address1'          => 'nullable|string|max:120',
            'billing_locality'          => 'nullable|string|max:60',
            'billing_administrative_area' => 'nullable|string|max:10',
            'billing_email'             => 'nullable|email|max:120',
            'billing_country'           => 'nullable|string|size:2',
            'billing_phone'             => 'nullable|string|max:30',
        ]);

        $booking = Booking::where('booking_code', strtoupper($code))
            ->with(['passengers.seat', 'schedule.busRoute.originCity', 'schedule.busRoute.destinationCity'])
            ->firstOrFail();

        if ($booking->status === 'confirmed') {
            return response($this->render_error_html('Reserva ya Pagada', 'Esta reserva ya fue pagada.', 'ALREADY_PAID', strtoupper($code)), 409, ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        if ($booking->status === 'cancelled') {
            return response($this->render_error_html('Reserva Cancelada', 'Esta reserva fue cancelada y no puede procesarse.', 'CANCELLED', strtoupper($code)), 422, ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        // --- Validaciones de tarjeta ---
        $cardNumber = preg_replace('/\D/', '', $data['card_number']);

        if (!$this->luhnCheck($cardNumber)) {
            return response($this->render_error_html('Tarjeta Inválida', 'El número de tarjeta no es válido.', 'INVALID_NUMBER', $booking->booking_code), 422, ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        if (!$this->isExpiryValid((int) $data['expiry_month'], (int) $data['expiry_year'])) {
            return response($this->render_error_html('Tarjeta Vencida', 'La tarjeta está vencida.', 'EXPIRED_CARD', $booking->booking_code), 422, ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        $firstPassenger = $booking->passengers->first();
        $destination = $booking->schedule->busRoute->destinationCity->name ?? '';
        $amount = (string) $booking->total_amount;
        $currency = 'BOB';

        $jsonArray = [
            "clientReferenceInformation" => [
                "code" => "TC" . $booking->booking_code
            ],
            "processingInformation" => [
                "capture" => "true"
            ],
            "paymentInformation" => [
                "card" => [
                    "number" => $cardNumber,
                    "expirationMonth" => str_pad($data['expiry_month'], 2, '0', STR_PAD_LEFT),
                    "expirationYear" => (string) $data['expiry_year'],
                    "securityCode" => $data['cvv']
                ]
            ],
            "orderInformation" => [
                "amountDetails" => [
                    //"totalAmount" => $amount,
                    "totalAmount" => 1,
                    "currency" => $currency
                ],
                "billTo" => [
                    "firstName" => $data['billing_first_name'] ?? '',
                    "lastName" => $data['billing_last_name'] ?? '',
                    "address1" => $data['billing_address1'] ?? '',
                    "locality" => $data['billing_locality'] ?? '',
                    "administrativeArea" => "L",
                    "postalCode" => '',
                    "country" => 'BO',
                    "email" => $data['billing_email'] ?? '',
                    "phoneNumber" => $data['billing_phone'] ?? ''
                ]
            ],
            "deviceInformation" => [
                "fingerprintSessionId" => "b456789hzo"
            ],
            "buyerInformation" => [
                "mobilePhone" => $data['billing_phone'] ?? ''
            ],
            "consumerAuthenticationInformation" => [
                "transactionMode" => "MOTO"
            ],
            "merchantDefinedInformation" => [
                ["key" => "4", "value" => "050220"],
                ["key" => "6", "value" => "false"],
                ["key" => "11", "value" => $data['billing_email'] ?? ''],
                ["key" => "17", "value" => "false"],
                ["key" => "18", "value" => ""],
                ["key" => "51", "value" => "false"],
                ["key" => "52", "value" => $firstPassenger ? ($firstPassenger->first_name . ' ' . $firstPassenger->last_name) : ''],
                ["key" => "54", "value" => $firstPassenger ? (string) $firstPassenger->document_number : ''],
                ["key" => "59", "value" => "2"],
                ["key" => "60", "value" => $destination],
                ["key" => "61", "value" => "BOLIVIA"]
            ]
        ];

        $this->ksortRecursive($jsonArray);
        $jsonString = json_encode($jsonArray);

        logger()->info("REQUEST CYBERSOURCE");
        logger()->info($jsonString);

        $date_transaction = $this->get_date();
        $blue_print = $this->get_blueprint($jsonString);
        #$heeaders_string = $this->get_headers_string($date_transaction, $blue_print, "/pts/v2/payments/", 'redenlace_000014');
        $heeaders_string = $this->get_headers_string($date_transaction, $blue_print, "/pts/v2/payments/", 'redenlace_400037');

        #$keyc = 'RhX6x8VUrji8D7JpuKyxF3wqbSJmfrcV3VK0Z/euxrs=';
        #$clave = '49e40d24-9068-4d71-8ca9-18054e76d737';
        #$url = "apitest.cybersource.com";
        $keyc = 'jSmwKLXHzG4ZKWsNGXTkWV3B5OwlGvqOcyYHPykWlPw=';
        $clave = 'c3c5e4d2-d892-49e4-bbf8-107a558ea163';
        $url = "api.cybersource.com";

        $signature_hash = $this->get_signature_hash($heeaders_string, $keyc);
        $signature = $this->get_signature($signature_hash, $clave);

        logger()->info("URL");
        logger()->info($url);

        $response = Http::withHeaders([
            'Host' => $url,
            'Date' => $date_transaction,
            'Digest' => 'SHA-256=' . $blue_print,
            'v-c-merchant-id' => 'redenlace_400037',
            'Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/hal+json;charset=utf-8',
        ])->withBody($jsonString, 'application/json')->post("https://{$url}/pts/v2/payments/");

        $d = $response->json();
        $status = $d['status'] ?? '';
        $idtr = $d['id'] ?? '';

        logger()->info("STATUS: " . $status);

        if ($status === 'AUTHORIZED') {
            $booking->update(['status' => 'confirmed']);
            $paymentData = ['card_number' => $cardNumber];
            $paymentResult = $d;
            $html = $this->render_invoice_html($booking, $paymentData, $paymentResult);
        } else {
            $errorReason = $d['errorInformation']['message']
                ?? $d['message']
                ?? 'Error desconocido al procesar el pago.';
            $errorCode = $d['errorInformation']['reason']
                ?? $d['reason']
                ?? $status;
            $html = $this->render_error_html('Error al Procesar el Pago', $errorReason, $errorCode, $booking->booking_code);
        }

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    private function render_invoice_html(Booking $booking, array $paymentData, array $paymentResult): string
    {
        $schedule = $booking->schedule;
        $route = $schedule?->busRoute;
        $origin = $route?->originCity?->name ?? '—';
        $destination = $route?->destinationCity?->name ?? '—';
        $departure = $schedule?->departure_at ? $schedule->departure_at->format('d/m/Y H:i') : '—';
        $arrival = $schedule?->arrival_at ? $schedule->arrival_at->format('d/m/Y H:i') : '—';
        $busName = e($schedule->bus_name ?? '—');
        $busType = e(ucfirst($schedule->bus_type ?? '—'));
        $transactionId = e($paymentResult['id'] ?? '—');
        $cardLast4 = substr($paymentData['card_number'] ?? '', -4);
        $now = now()->format('d/m/Y H:i');

        $passengersRows = '';
        foreach ($booking->passengers as $i => $p) {
            $seatNum = e($p->seat->seat_number ?? '—');
            $deck = e(ucfirst($p->seat->deck ?? '—'));
            $passengersRows .= '<tr>'
                . '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' . ($i + 1) . '</td>'
                . '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' . e($p->first_name) . ' ' . e($p->last_name) . '</td>'
                . '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' . e($p->document_type) . ': ' . e($p->document_number) . '</td>'
                . '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' . $seatNum . ' (' . $deck . ')</td>'
                . '</tr>';
        }

        return '<!DOCTYPE html>'
            . '<html><head><meta charset="UTF-8"><title>Factura - ' . e($booking->booking_code) . '</title>'
            . '<style>'
            . '*{box-sizing:border-box;margin:0;padding:0;}'
            . 'body{font-family:"Segoe UI",sans-serif;background:#f5f5f5;padding:20px;}'
            . '.invoice{max-width:700px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;}'
            . '.header{background:#2c7a3e;color:#fff;padding:30px;display:flex;justify-content:space-between;align-items:center;}'
            . '.header h1{font-size:24px;}'
            . '.header .code{font-size:14px;opacity:0.9;}'
            . '.badge{display:inline-block;background:#fff;color:#2c7a3e;padding:4px 12px;border-radius:20px;font-weight:bold;font-size:13px;}'
            . '.section{padding:20px 30px;}'
            . '.section-title{font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;border-bottom:2px solid #2c7a3e;padding-bottom:4px;display:inline-block;}'
            . '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 30px;margin-bottom:8px;}'
            . '.info-grid .label{font-size:12px;color:#888;}'
            . '.info-grid .value{font-size:14px;font-weight:500;color:#333;}'
            . 'table{width:100%;border-collapse:collapse;margin-top:8px;}'
            . 'th{text-align:left;padding:8px 12px;background:#f8f8f8;font-size:12px;color:#666;text-transform:uppercase;border-bottom:2px solid #ddd;}'
            . 'td{font-size:13px;color:#333;}'
            . '.total-section{background:#f0f9f0;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;border-top:2px solid #2c7a3e;}'
            . '.total-label{font-size:16px;color:#555;}'
            . '.total-amount{font-size:28px;font-weight:bold;color:#2c7a3e;}'
            . '.footer{padding:15px 30px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee;}'
            . '.route-arrow{font-size:20px;color:#2c7a3e;margin:0 8px;}'
            . '.route-box{text-align:center;padding:15px;background:#f8fdf8;border-radius:6px;margin:10px 0;}'
            . '.route-city{font-size:18px;font-weight:bold;color:#333;}'
            . '.print-btn{display:inline-block;margin-top:15px;padding:10px 25px;background:#2c7a3e;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;text-decoration:none;}'
            . '.print-btn:hover{background:#235f31;}'
            . '@media print{body{padding:0;background:#fff;}.invoice{box-shadow:none;}.print-btn{display:none !important;}}'
            . '</style>'
            . '</head><body>'
            . '<div class="invoice">'
            . '<div class="header">'
            . '<div><h1>Comprobante de Pago</h1><div class="code">N&ordm; ' . e($booking->booking_code) . '</div></div>'
            . '<div><span class="badge">PAGADO</span></div>'
            . '</div>'
            . '<div class="section">'
            . '<div class="section-title">Ruta</div>'
            . '<div class="route-box">'
            . '<span class="route-city">' . e($origin) . '</span>'
            . '<span class="route-arrow">&#10132;</span>'
            . '<span class="route-city">' . e($destination) . '</span>'
            . '</div>'
            . '</div>'
            . '<div class="section">'
            . '<div class="section-title">Detalles del Viaje</div>'
            . '<div class="info-grid">'
            . '<div><div class="label">Salida</div><div class="value">' . e($departure) . '</div></div>'
            . '<div><div class="label">Llegada</div><div class="value">' . e($arrival) . '</div></div>'
            . '<div><div class="label">Bus</div><div class="value">' . $busName . '</div></div>'
            . '<div><div class="label">Tipo</div><div class="value">' . $busType . '</div></div>'
            . '</div>'
            . '</div>'
            . '<div class="section">'
            . '<div class="section-title">Pasajeros</div>'
            . '<table>'
            . '<thead><tr><th>#</th><th>Nombre</th><th>Documento</th><th>Asiento</th></tr></thead>'
            . '<tbody>' . $passengersRows . '</tbody>'
            . '</table>'
            . '</div>'
            . '<div class="section">'
            . '<div class="section-title">Información de Pago</div>'
            . '<div class="info-grid">'
            . '<div><div class="label">Método</div><div class="value">Tarjeta ****' . e($cardLast4) . '</div></div>'
            . '<div><div class="label">Transacción</div><div class="value" style="font-size:11px;">' . $transactionId . '</div></div>'
            . '<div><div class="label">Fecha de Pago</div><div class="value">' . e($now) . '</div></div>'
            . '<div><div class="label">Contacto</div><div class="value">' . e($booking->contact_email) . '</div></div>'
            . '</div>'
            . '</div>'
            . '<div class="total-section">'
            . '<div class="total-label">Total Pagado</div>'
            . '<div class="total-amount">BOB ' . e(number_format((float) $booking->total_amount, 2, ',', '.')) . '</div>'
            . '</div>'
            . '<div class="footer">'
            . '<p>Gracias por su compra. Conserve este comprobante como respaldo de su transacción.</p>'
            . '<button class="print-btn" onclick="window.print()">Imprimir Comprobante</button>'
            . '&nbsp;'
            . '<a class="print-btn" href="' . e(env('FRONTEND_URL', 'http://localhost:4200')) . '" style="background:#555;">Volver al Inicio</a>'
            . '</div>'
            . '</div>'
            . '</body></html>';
    }

    private function render_error_html(string $title, string $reason, string $errorCode, string $bookingCode): string
    {
        return '<!DOCTYPE html>'
            . '<html><head><meta charset="UTF-8"><title>' . e($title) . '</title>'
            . '<style>'
            . 'body{font-family:"Segoe UI",sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fef0f0;}'
            . '.card{background:#fff;padding:40px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.1);text-align:center;max-width:500px;}'
            . '.error{color:#721c24;}'
            . '.icon{font-size:48px;margin-bottom:16px;}'
            . '.reason{background:#f8f8f8;padding:12px 16px;border-radius:6px;text-align:left;margin-top:16px;font-size:14px;color:#555;}'
            . '.code-label{font-size:12px;color:#999;margin-top:8px;}'
            . '</style></head>'
            . '<body><div class="card">'
            . '<div class="icon">&#10060;</div>'
            . '<h2 class="error">' . e($title) . '</h2>'
            . '<p>Reserva: <strong>' . e($bookingCode) . '</strong></p>'
            . '<div class="reason"><strong>Razón:</strong> ' . e($reason) . '</div>'
            . '<div class="code-label">Código: ' . e($errorCode) . '</div>'
            . '<br>'
            . '<a href="' . e(env('FRONTEND_URL', 'http://localhost:4200')) . '" style="display:inline-block;margin-top:10px;padding:10px 25px;background:#555;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;">Volver al Inicio</a>'
            . '</div></body></html>';
    }

        private function get_date(): string
    {
        return gmdate('D, d M Y H:i:s') . ' GMT';
    }

    private function get_blueprint(string $jsonString): string
    {
        $hash_data = hash('sha256', $jsonString, true);
        $encoded_data = base64_encode($hash_data);
        $blue_print = $encoded_data;

        return $blue_print;
    }

    private function get_headers_string(string $date_transaction, string $blue_print, string $url, string $merchant): string
    {
        $headers = "host: apitest.cybersource.com\n";
        $headers .= 'date: ' . $date_transaction . "\n";
        $headers .= '(request-target): post ' . $url . "\n";
        $headers .= 'digest: SHA-256=' . $blue_print . "\n";
        $headers .= 'v-c-merchant-id: ' . $merchant;
        logger()->info('HEADERS STRING');
        logger()->info($headers);

        return $headers;
    }

    private function get_signature_hash(string $headers, string $merchant_secret_key): string
    {
        $sig_value_string = (string) $headers;
        $secret = base64_decode($merchant_secret_key, true);
        if ($secret === false) {
            throw new \RuntimeException('Invalid merchant secret key');
        }
        $hash_value = hash_hmac('sha256', $sig_value_string, $secret, true);
        $signature_hash = base64_encode($hash_value);

        return $signature_hash;
    }

    private function get_signature(string $signature_hash, string $key_id): string
    {
        $signature = 'keyid="' . $key_id . '", algorithm="HmacSHA256", headers="host date (request-target) digest v-c-merchant-id", signature="' . $signature_hash . '"';

        return $signature;
    }

    private function ksortRecursive(array &$array): void
    {
        foreach ($array as &$value) {
            if (is_array($value) && !array_is_list($value)) {
                $this->ksortRecursive($value);
            }
        }
        if (!array_is_list($array)) {
            ksort($array);
        }
    }

    private function luhnCheck(string $number): bool
    {
        $sum = 0;
        $len = strlen($number);
        for ($i = 0; $i < $len; $i++) {
            $digit = (int) $number[$len - 1 - $i];
            if ($i % 2 === 1) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }
            $sum += $digit;
        }
        return $sum % 10 === 0;
    }

    private function isExpiryValid(int $month, int $year): bool
    {
        $now = now();
        return $year > $now->year || ($year === $now->year && $month >= $now->month);
    }
}
