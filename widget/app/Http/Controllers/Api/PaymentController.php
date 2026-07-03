<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class PaymentController extends Controller
{
    public function pay(string $code, Request $request): JsonResponse|Response
    {
        $org_id = '1snn5n9w';
        // este es el contexto de la pagina definida en /redirect/templates/fp/{{template}}.html, se pasa el context al template
        // real sequnum con el id correcto
        $seqnum = DB::table('seguence')->orderByDesc('seqNumber')->value('seqNumber');
        logger()->info('Fetched seqNumber from DB', ['seqNum' => $seqnum]);
        $realseq = 'redenlace_000014' . strval($seqnum);
        $context = [
            'seqNum' => $realseq,
            'id' => $org_id,
        ];
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
            return response()->json(['message' => 'Esta reserva ya fue pagada.'], 409);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Esta reserva fue cancelada y no puede procesarse.'], 422);
        }

        // --- Validaciones de tarjeta ---
        $cardNumber = preg_replace('/\D/', '', $data['card_number']);

        if (!$this->luhnCheck($cardNumber)) {
            return response()->json([
                'message'      => 'El número de tarjeta no es válido.',
                'field'        => 'card_number',
                'decline_code' => 'invalid_number',
            ], 422);
        }

        if (!$this->isExpiryValid((int) $data['expiry_month'], (int) $data['expiry_year'])) {
            return response()->json([
                'message'      => 'La tarjeta está vencida.',
                'field'        => 'expiry',
                'decline_code' => 'expired_card',
            ], 422);
        }


        $authentication_setup = $this->authentication_setup($data, $cardNumber);
        $authentication_setup_data = $authentication_setup->getData(true);
        $reference_id = $authentication_setup_data['consumerAuthenticationInformation']['referenceId'] ?? null;
        $accessToken = $authentication_setup_data['consumerAuthenticationInformation']['accessToken'] ?? null;
        $url = $authentication_setup_data['consumerAuthenticationInformation']['deviceDataCollectionUrl'] ?? null;

        if ($reference_id === null || $accessToken === null) {
            return response()->json([
                'message' => 'No se pudo obtener referenceId o accessToken desde authentication_setup.',
                'gateway_response' => $authentication_setup_data,
            ], 422);
        }

        cache()->put("3ds_ref_{$code}", $reference_id, now()->addMinutes(10));

        $booking->update([
            'cybersource_reference_id' => $reference_id,
            'cybersource_payment_data' => [
                'context' => $context,
                'realseq' => $realseq,
                'card_number' => $cardNumber,
                'expiry_month' => str_pad((string) $data['expiry_month'], 2, '0', STR_PAD_LEFT),
                'expiry_year' => (string) $data['expiry_year'],
                'cvv' => $data['cvv'],
                'billing_first_name' => $data['billing_first_name'] ?? 'Roberto',
                'billing_last_name' => $data['billing_last_name'] ?? 'Jimenez',
                'billing_address1' => $data['billing_address1'] ?? 'Calle Herber 123',
                'billing_locality' => $data['billing_locality'] ?? 'La Paz',
                'billing_administrative_area' => $data['billing_administrative_area'] ?? 'L',
                'billing_country' => $data['billing_country'] ?? 'BO',
                'billing_phone' => $data['billing_phone'] ?? '65612459',
                'billing_email' => $data['billing_email'] ?? $booking->contact_email,
            ],
        ]);

        return $this->render_collection_html($code, $reference_id, $accessToken, $url, $context);
    }

    public function enrollment_callback(string $code, Request $request): JsonResponse|Response
    {
        try {
            DB::table('seguence')->orderByDesc('seqNumber')->limit(1)->update(['seqNumber' => DB::raw('seqNumber + 1')]);
        } catch (Throwable $e) {
            logger()->error('No se pudo actualizar seqNumber', ['error' => $e->getMessage()]);
        }
        $booking = Booking::where('booking_code', strtoupper($code))
            ->with(['passengers.seat', 'schedule.busRoute.originCity', 'schedule.busRoute.destinationCity'])
            ->firstOrFail();
        $reference_id = $booking->cybersource_reference_id;
        $paymentData = $booking->cybersource_payment_data;

        if ($reference_id === null || $paymentData === null) {
            return response()->json([
                'message' => 'reference_id o datos de pago no encontrados.',
            ], 422);
        }

        $browserInfo = [
            'acceptHeader'    => $request->query('browserAcceptHeader', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'),
            'language'        => $request->query('browserLanguage', 'es-BO'),
            'userAgent'       => $request->query('browserUserAgent', $request->userAgent() ?? 'Mozilla/5.0'),
            'screenHeight'    => $request->query('browserScreenHeight', '768'),
            'screenWidth'     => $request->query('browserScreenWidth', '1366'),
            'javaEnabled'     => $request->query('browserJavaEnabled', 'false') === 'true',
        ];

        $enrollmentResponse = $this->enrollment_setup($reference_id, $paymentData, $booking, $browserInfo);
        $enrollmentData = $enrollmentResponse->getData(true);
        logger()->info('ENROLLMENT_SETUP called', ['code' => $code, 'all_input' => $enrollmentData]);
        if (($enrollmentData['status'] ?? '') === 'AUTHENTICATION_SUCCESSFUL') {
            $paymentResponse = $this->payment_with_3ds_dynamic($paymentData, $booking, $enrollmentData, "NO_3DS", $paymentData['context'] ?? null);
            $paymentResult = $paymentResponse->getData(true);
            $paymentStatus = $paymentResult['status'] ?? 'UNKNOWN';

            if ($paymentStatus === 'AUTHORIZED') {
                $booking->update(['status' => 'confirmed']);

                return response(
                    $this->render_invoice_html($booking, $paymentData, $paymentResult),
                    200,
                    ['Content-Type' => 'text/html; charset=UTF-8']
                );
            }

            $errorReason = $paymentResult['errorInformation']['message']
                ?? $paymentResult['message']
                ?? 'Error desconocido al procesar el pago.';
            $errorCode = $paymentResult['errorInformation']['reason']
                ?? $paymentResult['reason']
                ?? $paymentStatus;

            return response(
                $this->render_error_html(
                    'Error al Procesar el Pago',
                    $errorReason,
                    $errorCode,
                    $booking->booking_code
                ),
                200,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }

        if (($enrollmentData['status'] ?? '') === 'PENDING_AUTHENTICATION') {
            $stepUpUrl = $enrollmentData['consumerAuthenticationInformation']['stepUpUrl'] ?? 'https://centinelapistag.cardinalcommerce.com/V2/Cruise/StepUp';
            $stepUpToken = $enrollmentData['consumerAuthenticationInformation']['accessToken'] ?? '';
            $authTransactionId = $enrollmentData['consumerAuthenticationInformation']['authenticationTransactionId'] ?? '';

            $booking->update([
                'cybersource_payment_data' => array_merge($paymentData, [
                    'authentication_transaction_id' => $authTransactionId,
                ]),
            ]);

            return $this->render_stepup_html($code, $stepUpUrl, $stepUpToken);
        }

        return $enrollmentResponse;
    }

    public function enrollment_result(string $code, Request $request): JsonResponse|Response
    {
        logger()->info('ENROLLMENT_RESULT called', ['code' => $code, 'all_input' => $request->all()]);

        $booking = Booking::where('booking_code', strtoupper($code))
            ->with(['passengers.seat', 'schedule.busRoute.originCity', 'schedule.busRoute.destinationCity'])
            ->firstOrFail();
        $paymentData = $booking->cybersource_payment_data;
        logger()->info('Fetched booking and payment data', ['booking_id' => $booking->id, 'payment_data' => $paymentData]);

        if ($paymentData === null) {
            return response()->json(['message' => 'Datos de pago no encontrados.'], 422);
        }

        $authTransactionId = $paymentData['authentication_transaction_id'] ?? $request->input('TransactionId');

        if (!$authTransactionId) {
            return response()->json(['message' => 'authenticationTransactionId no encontrado.'], 422);
        }

        $validAuthResponse = $this->valid_auth_dynamic($authTransactionId, $paymentData, $booking);
        logger()->info('VALID_AUTH_DYNAMIC called', ['code' => $code, 'authTransactionId' => $authTransactionId]);
        $validAuthData = $validAuthResponse->getData(true);

        logger()->info('VALID_AUTH_DYNAMIC RESULT', $validAuthData);

        $status = $validAuthData['status'] ?? 'UNKNOWN';

        if ($status === 'AUTHENTICATION_SUCCESSFUL') {
            $paymentResponse = $this->payment_with_3ds_dynamic($paymentData, $booking, $validAuthData, "3DS", $paymentData['context'] ?? null);
            $paymentResult = $paymentResponse->getData(true);

            logger()->info('PAYMENT_WITH_3DS_DYNAMIC RESULT', $paymentResult);

            $paymentStatus = $paymentResult['status'] ?? 'UNKNOWN';

            if ($paymentStatus === 'AUTHORIZED') {
                $booking->update(['status' => 'confirmed']);
                $html = $this->render_invoice_html($booking, $paymentData, $paymentResult);
            } else {
                $errorReason = $paymentResult['errorInformation']['message']
                    ?? $paymentResult['message']
                    ?? 'Error desconocido al procesar el pago.';
                $errorCode = $paymentResult['errorInformation']['reason']
                    ?? $paymentResult['reason']
                    ?? $paymentStatus;

                $html = $this->render_error_html(
                    'Error al Procesar el Pago',
                    $errorReason,
                    $errorCode,
                    $booking->booking_code
                );
            }
        } else {
            $errorReason = $validAuthData['errorInformation']['message']
                ?? $validAuthData['message']
                ?? 'La autenticación 3DS no fue exitosa.';
            $errorCode = $validAuthData['errorInformation']['reason']
                ?? $validAuthData['reason']
                ?? $status;

            $html = $this->render_error_html(
                'Error en Autenticación 3DS',
                $errorReason,
                $errorCode,
                $booking->booking_code
            );
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
            // Header
            . '<div class="header">'
            . '<div><h1>Comprobante de Pago</h1><div class="code">N&ordm; ' . e($booking->booking_code) . '</div></div>'
            . '<div><span class="badge">PAGADO</span></div>'
            . '</div>'
            // Route
            . '<div class="section">'
            . '<div class="section-title">Ruta</div>'
            . '<div class="route-box">'
            . '<span class="route-city">' . e($origin) . '</span>'
            . '<span class="route-arrow">&#10132;</span>'
            . '<span class="route-city">' . e($destination) . '</span>'
            . '</div>'
            . '</div>'
            // Trip details
            . '<div class="section">'
            . '<div class="section-title">Detalles del Viaje</div>'
            . '<div class="info-grid">'
            . '<div><div class="label">Salida</div><div class="value">' . e($departure) . '</div></div>'
            . '<div><div class="label">Llegada</div><div class="value">' . e($arrival) . '</div></div>'
            . '<div><div class="label">Bus</div><div class="value">' . $busName . '</div></div>'
            . '<div><div class="label">Tipo</div><div class="value">' . $busType . '</div></div>'
            . '</div>'
            . '</div>'
            // Passengers
            . '<div class="section">'
            . '<div class="section-title">Pasajeros</div>'
            . '<table>'
            . '<thead><tr><th>#</th><th>Nombre</th><th>Documento</th><th>Asiento</th></tr></thead>'
            . '<tbody>' . $passengersRows . '</tbody>'
            . '</table>'
            . '</div>'
            // Payment info
            . '<div class="section">'
            . '<div class="section-title">Información de Pago</div>'
            . '<div class="info-grid">'
            . '<div><div class="label">Método</div><div class="value">Tarjeta ****' . e($cardLast4) . '</div></div>'
            . '<div><div class="label">Transacción</div><div class="value" style="font-size:11px;">' . $transactionId . '</div></div>'
            . '<div><div class="label">Fecha de Pago</div><div class="value">' . e($now) . '</div></div>'
            . '<div><div class="label">Contacto</div><div class="value">' . e($booking->contact_email) . '</div></div>'
            . '</div>'
            . '</div>'
            // Total
            . '<div class="total-section">'
            . '<div class="total-label">Total Pagado</div>'
            . '<div class="total-amount">BOB ' . e(number_format((float) $booking->total_amount, 2, ',', '.')) . '</div>'
            . '</div>'
            // Footer
            . '<div class="footer">'
            . '<p>Gracias por su compra. Conserve este comprobante como respaldo de su transacción.</p>'
            . '<button class="print-btn" onclick="window.print()">Imprimir Comprobante</button>'
            . '&nbsp;'
            . '<a class="print-btn" href="' . e(env('FRONTEND_URL', 'https://viajerosbo.up.railway.app')) . '" style="background:#555;">Volver al Inicio</a>'
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
            . '</div></body></html>';
    }

    private function render_collection_html(string $code, string $reference_id, string $accessToken, ?string $url, $context): Response
    {
        $callbackUrl = rtrim((string) config('app.url'), '/')
            . '/api/bookings/' . rawurlencode($code)
            . '/enrollment-callback';

        $domain = parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST);

        $html = '<!DOCTYPE html>'
            . '<html>'
            . '<head>'
            . '<title>Payment</title>'
            . '<meta charset="UTF-8">'
            . '<script type="text/javascript" src="https://h.online-metrix.net/fp/tags.js?org_id='. e($context['id']) .'&session_id=' . e($context['seqNum']) . '"></script>'
            . '</head>'
            . '<body>'
            . '<iframe id="cardinal_collection_iframe" name="collectionIframe" height="10" width="10" style="display:none;"></iframe>'
            . '<form id="cardinal_collection_form" method="POST" target="collectionIframe" action="' . e($url) . '">'
            . '<input id="cardinal_collection_form_input" type="hidden" name="JWT" value="' . e($accessToken) . '">'
            . '</form>'
            . '<script>'
            . 'window.onload = function() {'
            . 'var cardinalCollectionForm = document.querySelector("#cardinal_collection_form");'
            . 'if(cardinalCollectionForm){cardinalCollectionForm.submit();}'
            . '};'
            . '</script>'
            . '<script>'
            . 'window.addEventListener("message", function(event) {'
            . 'if(event.origin === "' . e($domain) . '"){'
            . 'console.log(event.data);'
            . 'var data = event.data;'
            . 'if(typeof data === "string"){ try { data = JSON.parse(data); } catch(e){} }'
            . 'if(data && data.MessageType === "profile.completed"){'
            . 'console.log("Cardinal collection complete, redirecting...");'
            . 'var url = ' . json_encode($callbackUrl) . ';'
            . 'url += "?browserAcceptHeader=" + encodeURIComponent("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");'
            . 'url += "&browserLanguage=" + encodeURIComponent(navigator.language || "es-BO");'
            . 'url += "&browserUserAgent=" + encodeURIComponent(navigator.userAgent);'
            . 'url += "&browserScreenHeight=" + encodeURIComponent(screen.height);'
            . 'url += "&browserScreenWidth=" + encodeURIComponent(screen.width);'
            . 'url += "&browserJavaEnabled=" + encodeURIComponent(navigator.javaEnabled ? navigator.javaEnabled() : false);'
            . 'window.location.href = url;'
            . '}'
            . '}'
            . '}, false);'
            . '</script>'
            . '<noscript>'
            . '<iframe style="width: 100px; height: 100px; border: 0; position: absolute; top: -5000px;" src="https://h.online-metrix.net/fp/tags?org_id='. e($context['id']) .'&session_id=' . e($context['seqNum']) . '"></iframe>'
            . '</noscript>'
            . '</body>'
            . '</html>';

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    private function render_stepup_html(string $code, string $stepUpUrl, string $accessToken): Response
    {
        $enrollmentResultUrl = rtrim((string) config('app.url'), '/')
            . '/api/bookings/' . rawurlencode($code)
            . '/enrollment-result';

        $html = '<!DOCTYPE html>'
            . '<html lang="en">'
            . '<head>'
            . '<meta charset="UTF-8">'
            . '<title>3DS2 Step-Up Challenge</title>'
            . '</head>'
            . '<body>'
            . '<form id="step-up-form" method="post" action="' . e($stepUpUrl) . '">'
            . '<input type="hidden" name="JWT" value="' . e($accessToken) . '" />'
            . '<input type="hidden" name="MD" value="' . e($code) . '" />'
            . '</form>'
            . '<script>'
            . 'window.onload = function() {'
            . 'var stepUpForm = document.querySelector("#step-up-form");'
            . 'if(stepUpForm) stepUpForm.submit();'
            . '};'
            . '</script>'
            . '</body>'
            . '</html>';

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    // -----------------------------------------------------------------------
    // Algoritmo de Luhn para validar número de tarjeta
    // -----------------------------------------------------------------------
    private function luhnCheck(string $number): bool
    {
        if (!ctype_digit($number) || strlen($number) < 13 || strlen($number) > 19) {
            return false;
        }

        $sum    = 0;
        $parity = strlen($number) % 2;

        for ($i = 0; $i < strlen($number); $i++) {
            $digit = (int) $number[$i];
            if ($i % 2 === $parity) {
                $digit *= 2;
                if ($digit > 9) $digit -= 9;
            }
            $sum += $digit;
        }

        return $sum % 10 === 0;
    }

    private function isExpiryValid(int $month, int $year): bool
    {
        $now = now();
        if ($year > $now->year) return true;
        if ($year === $now->year && $month >= $now->month) return true;
        return false;
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

    private function resolveCardType(string $cardNumber): string
    {
        $normalizedCardNumber = preg_replace('/\D+/', '', $cardNumber);

        if (!is_string($normalizedCardNumber) || $normalizedCardNumber === '') {
            return '001'; // Visa (default)
        }

        // AMEX: starts with 34/37 and has 15 digits.
        if (preg_match('/^3[47][0-9]{13}$/', $normalizedCardNumber)) {
            return '003'; // American Express
        }

        // Mastercard: 51-55 or 2221-2720, 16 digits.
        if (preg_match('/^5[1-5][0-9]{14}$/', $normalizedCardNumber)
            || preg_match('/^2(2[2-9][0-9]{12}|[3-6][0-9]{13}|7[01][0-9]{12}|720[0-9]{12})$/', $normalizedCardNumber)) {
            return '002'; // Mastercard
        }

        return '001'; // Visa (default)
    }

    public function authentication_setup(array $frontendData, string $cardNumber): JsonResponse
    {
        $randomCode = 'Pago_comercio_' . random_int(100000, 999999);

        $type = $this->resolveCardType($cardNumber);

        $jsonString = [
            'clientReferenceInformation' => [
                'code' => $randomCode,
            ],
            'paymentInformation' => [
                'card' => [
                    'number' => $cardNumber,
                    'expirationMonth' => str_pad((string) $frontendData['expiry_month'], 2, '0', STR_PAD_LEFT),
                    'expirationYear' => (string) $frontendData['expiry_year'],
                    'type' => $type,
                ],
            ],
        ];
        $jsonString = $this->json_dumps($jsonString);
        logger()->info('JSON INPUT FOR AUTHENTICATION SETUP');
        logger()->info($jsonString);
        $keyc = 'RhX6x8VUrji8D7JpuKyxF3wqbSJmfrcV3VK0Z/euxrs=';
        $clave = '49e40d24-9068-4d71-8ca9-18054e76d737';
        $date_transaction = $this->get_date();
        $blue_print = $this->get_blueprint($jsonString);
        $headers_string = $this->get_headers_string($date_transaction, $blue_print, '/risk/v1/authentication-setups', 'redenlace_000014');
        $signature_hash = $this->get_signature_hash($headers_string, $keyc);
        $signature = $this->get_signature($signature_hash, $clave);
        logger()->info('BLUE PRINT');
        logger()->info($blue_print);
        logger()->info('SIGNATURE');
        logger()->info($signature);
        logger()->info('DATE TRANSACTION');
        logger()->info($date_transaction);
        $headersReq = [
            'Host' => 'apitest.cybersource.com',
            'Date' => $date_transaction,
            'Digest' => 'SHA-256=' . $blue_print,
            'v-c-merchant-id' => 'redenlace_000014',
            'Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/hal+json;charset=utf-8',
        ];
        logger()->info('HEADERS REQ', $headersReq);
        $res = Http::withHeaders($headersReq)
            ->withBody($jsonString, 'application/json')
            ->post('https://apitest.cybersource.com/risk/v1/authentication-setups');
        $data = $res->body();
        logger()->info('RESPONSE STATUS');
        logger()->info($data);
        $json_acceptable_string = str_replace("'", '"', $data);
        $response = json_decode($json_acceptable_string, true);

        return response()->json($response ?? ['raw' => $data], $res->status());
    }

    public function enrollment_setup(string $reference_id, array $paymentData, Booking $booking, array $browserInfo = []): JsonResponse
    {
        $jsonString = [
            'clientReferenceInformation' => [
                'code' => $booking->booking_code,
            ],
            'orderInformation' => [
                'amountDetails' => [
                    'currency' => 'BOB',
                    'totalAmount' => number_format((float) $booking->total_amount, 2, '.', ''),
                ],
                'billTo' => [
                    'address1' => $paymentData['billing_address1'],
                    'administrativeArea' => "L",
                    'country' => 'BO',
                    'locality' => $paymentData['billing_locality'],
                    'firstName' => $paymentData['billing_first_name'],
                    'lastName' => $paymentData['billing_last_name'],
                    'phoneNumber' => $paymentData['billing_phone'],
                    'email' => $paymentData['billing_email'],
                    "postalCode" => "000000"
                ],
            ],
            'paymentInformation' => [
                'card' => [
                    'number' => $paymentData['card_number'],
                    'expirationMonth' => $paymentData['expiry_month'],
                    'expirationYear' => $paymentData['expiry_year'],
                    'type' => $this->resolveCardType($paymentData['card_number']),
                ],
            ],
            'consumerAuthenticationInformation' => [
                'referenceId' => $reference_id,
                'returnUrl' => rtrim((string) config('app.url'), '/') . '/api/bookings/' . rawurlencode($booking->booking_code) . '/enrollment-result',
                'transactionMode' => 'S',
            ],
            'browserInformation' => [
                'acceptHeader' => $browserInfo['acceptHeader'] ?? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'language' => $browserInfo['language'] ?? 'es-BO',
                'userAgent' => $browserInfo['userAgent'] ?? 'Mozilla/5.0',
                'screenHeight' => (int) ($browserInfo['screenHeight'] ?? 768),
                'screenWidth' => (int) ($browserInfo['screenWidth'] ?? 1366),
                'javaEnabled' => (bool) ($browserInfo['javaEnabled'] ?? false),
                'javascriptEnabled' => true,
            ],
        ];
        $jsonString = $this->json_dumps($jsonString);
        logger()->info('JSON INPUT FOR ENROLLMENT SETUP');
        logger()->info($jsonString);
        $keyc = 'RhX6x8VUrji8D7JpuKyxF3wqbSJmfrcV3VK0Z/euxrs=';
        $clave = '49e40d24-9068-4d71-8ca9-18054e76d737';
        $date_transaction = $this->get_date();
        $blue_print = $this->get_blueprint($jsonString);
        $headers_string = $this->get_headers_string($date_transaction, $blue_print, '/risk/v1/authentications', 'redenlace_000014');
        $signature_hash = $this->get_signature_hash($headers_string, $keyc);
        $signature = $this->get_signature($signature_hash, $clave);
        logger()->info('BLUE PRINT');
        logger()->info($blue_print);
        logger()->info('SIGNATURE');
        logger()->info($signature);
        logger()->info('DATE TRANSACTION');
        logger()->info($date_transaction);
        $headersReq = [
            'Host' => 'apitest.cybersource.com',
            'Date' => $date_transaction,
            'Digest' => 'SHA-256=' . $blue_print,
            'v-c-merchant-id' => 'redenlace_000014',
            'Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/hal+json;charset=utf-8',
        ];
        logger()->info('HEADERS REQ', $headersReq);
        $res = Http::withHeaders($headersReq)
            ->withBody($jsonString, 'application/json')
            ->post('https://apitest.cybersource.com/risk/v1/authentications');
        logger()->info('RES');
        logger()->info('RES STATUS', ['status' => $res->status()]);
        $data = $res->body();
        logger()->info($data);
        logger()->info('RESPONSE STATUS');
        logger()->info($res->status());
        $json_acceptable_string = str_replace("'", '"', $data);
        $response = json_decode($json_acceptable_string, true);

        return response()->json($response ?? ['raw' => $data], $res->status());
    }

    private function valid_auth_dynamic(string $authTransactionId, array $paymentData, Booking $booking): JsonResponse
    {
        $jsonString = [
            'clientReferenceInformation' => [
                'code' => $booking->booking_code,
            ],
            'orderInformation' => [
                'amountDetails' => [
                    'currency' => 'BOB',
                    'totalAmount' => number_format((float) $booking->total_amount, 2, '.', ''),
                ],
                'billTo' => [
                    'address1' => $paymentData['billing_address1'],
                    'administrativeArea' => 'L',
                    'country' => 'BO',
                    'locality' => $paymentData['billing_locality'],
                    'firstName' => $paymentData['billing_first_name'],
                    'lastName' => $paymentData['billing_last_name'],
                    'phoneNumber' => $paymentData['billing_phone'],
                    'email' => $paymentData['billing_email'],
                    'postalCode' => '000000',
                ],
            ],
            'paymentInformation' => [
                'card' => [
                    'number' => $paymentData['card_number'],
                    'expirationMonth' => $paymentData['expiry_month'],
                    'expirationYear' => $paymentData['expiry_year'],
                    'type' => $this->resolveCardType($paymentData['card_number']),
                ],
            ],
            'consumerAuthenticationInformation' => [
                'authenticationTransactionId' => $authTransactionId,
            ],
        ];
        $jsonString = $this->json_dumps($jsonString);
        logger()->info('JSON INPUT FOR VALID_AUTH');
        logger()->info($jsonString);
        $keyc = 'RhX6x8VUrji8D7JpuKyxF3wqbSJmfrcV3VK0Z/euxrs=';
        $clave = '49e40d24-9068-4d71-8ca9-18054e76d737';
        $date_transaction = $this->get_date();
        $blue_print = $this->get_blueprint($jsonString);
        $headers_string = $this->get_headers_string($date_transaction, $blue_print, '/risk/v1/authentication-results', 'redenlace_000014');
        $signature_hash = $this->get_signature_hash($headers_string, $keyc);
        $signature = $this->get_signature($signature_hash, $clave);
        logger()->info('VALID_AUTH BLUE PRINT');
        logger()->info($blue_print);
        logger()->info('VALID_AUTH SIGNATURE');
        logger()->info($signature);
        $headersReq = [
            'Host' => 'apitest.cybersource.com',
            'Date' => $date_transaction,
            'Digest' => 'SHA-256=' . $blue_print,
            'v-c-merchant-id' => 'redenlace_000014',
            'Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/hal+json;charset=utf-8',
        ];
        $res = Http::withHeaders($headersReq)
            ->withBody($jsonString, 'application/json')
            ->post('https://apitest.cybersource.com/risk/v1/authentication-results');
        logger()->info('VALID_AUTH RES STATUS', ['status' => $res->status()]);
        $data = $res->body();
        logger()->info('VALID_AUTH RESPONSE', ['body' => $data]);
        $json_acceptable_string = str_replace("'", '"', $data);
        $response = json_decode($json_acceptable_string, true);

        return response()->json($response ?? ['raw' => $data], $res->status());
    }

    private function payment_with_3ds_dynamic(array $paymentData, Booking $booking, array $authData, string $type, ?array $context = null): JsonResponse
    {
        logger()->info('COMSUMER AUTH DATA', ['authData' => $authData]);
        $consumerAuth = $authData['consumerAuthenticationInformation'] ?? [];
        $commerceIndicator = ($type === '3DS')? $consumerAuth['indicator'] : $consumerAuth['ecommerceIndicator'];
        $context = is_array($context) ? $context : ($paymentData['context'] ?? []);
        $realSeq = explode('redenlace_000014', trim($context['seqNum']))[1] ?? '';
        logger()->info('PAYMENT WITH 3DS CONTEXT', ['realSeq' => $realSeq]);
        $firstPassenger = $booking->passengers->first();
        $destination = $booking->schedule->busRoute->destinationCity->name ?? '';

        $jsonString = [
            'clientReferenceInformation' => [
                'code' => $booking->booking_code,
            ],
            'processingInformation' => [
                'capture' => true,
                'commerceIndicator' => $commerceIndicator,
            ],
            'paymentInformation' => [
                'card' => [
                    'number' => $paymentData['card_number'],
                    'expirationMonth' => $paymentData['expiry_month'],
                    'expirationYear' => $paymentData['expiry_year'],
                    'type' => $this->resolveCardType($paymentData['card_number']),
                    'securityCode' => $paymentData['cvv'],
                ],
            ],
            'orderInformation' => [
                'amountDetails' => [
                    'totalAmount' => number_format((float) $booking->total_amount, 2, '.', ''),
                    'currency' => 'BOB',
                ],
                'billTo' => [
                    'address1' => $paymentData['billing_address1'],
                    'administrativeArea' => 'L',
                    'country' => 'BO',
                    'locality' => $paymentData['billing_locality'],
                    'firstName' => $paymentData['billing_first_name'],
                    'lastName' => $paymentData['billing_last_name'],
                    'phoneNumber' => $paymentData['billing_phone'],
                    'email' => $paymentData['billing_email'],
                ],
            ],
            'merchantDefinedInformation' => [
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
            ],
            'deviceInformation' => [
                'fingerprintSessionId' => $realSeq !== '' ? $realSeq : 'redenlace_000014',
            ],
            'consumerAuthenticationInformation' => [
                'cavv' => $consumerAuth['cavv'] ?? '',
                'xid' => $consumerAuth['xid'] ?? '',
                'ucafCollectionIndicator' => $consumerAuth['ucafCollectionIndicator'] ?? '',
                'ucafAuthenticationData' => $consumerAuth['ucafAuthenticationData'] ?? '',
                'directoryServerTransactionId' => $consumerAuth['directoryServerTransactionId'] ?? '',
                'paSpecificationVersion' => $consumerAuth['specificationVersion'] ?? '2.2.0',
            ],
        ];
        $jsonString = $this->json_dumps($jsonString);
        logger()->info('JSON INPUT FOR PAYMENT WITH 3DS');
        logger()->info($jsonString);
        $keyc = 'RhX6x8VUrji8D7JpuKyxF3wqbSJmfrcV3VK0Z/euxrs=';
        $clave = '49e40d24-9068-4d71-8ca9-18054e76d737';
        $date_transaction = $this->get_date();
        $blue_print = $this->get_blueprint($jsonString);
        $headers_string = $this->get_headers_string($date_transaction, $blue_print, '/pts/v2/payments/', 'redenlace_000014');
        $signature_hash = $this->get_signature_hash($headers_string, $keyc);
        $signature = $this->get_signature($signature_hash, $clave);
        logger()->info('PAYMENT_3DS BLUE PRINT', ['blueprint' => $blue_print]);
        logger()->info('PAYMENT_3DS SIGNATURE', ['signature' => $signature]);
        $headersReq = [
            'Host' => 'apitest.cybersource.com',
            'Date' => $date_transaction,
            'Digest' => 'SHA-256=' . $blue_print,
            'v-c-merchant-id' => 'redenlace_000014',
            'Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/hal+json;charset=utf-8',
        ];
        $res = Http::withHeaders($headersReq)
            ->withBody($jsonString, 'application/json')
            ->post('https://apitest.cybersource.com/pts/v2/payments/');
        logger()->info('PAYMENT_3DS RES STATUS', ['status' => $res->status()]);
        $data = $res->body();
        logger()->info('PAYMENT_3DS RESPONSE', ['body' => $data]);
        $json_acceptable_string = str_replace("'", '"', $data);
        $response = json_decode($json_acceptable_string, true);

        return response()->json($response ?? ['raw' => $data], $res->status());
    }
    private function json_dumps(array $data): string
    {
        $data = $this->ksort_recursive($data);

        return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
    }

    private function ksort_recursive(array $data): array
    {
        if ($this->is_assoc($data)) {
            ksort($data);
        }

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->ksort_recursive($value);
            }
        }

        return $data;
    }

    private function is_assoc(array $data): bool
    {
        return array_keys($data) !== range(0, count($data) - 1);
    }

    private function buildCybersourcePaymentPayload(Booking $booking, array $data, string $cardNumber): array
    {
        return [
            'clientReferenceInformation' => [
                'code' => $booking->booking_code,
            ],
            'processingInformation' => [
                'capture' => true,
            ],
            'paymentInformation' => [
                'card' => [
                    'number' => $cardNumber,
                    'expirationMonth' => str_pad((string) $data['expiry_month'], 2, '0', STR_PAD_LEFT),
                    'expirationYear' => (string) $data['expiry_year'],
                    'securityCode' => $data['cvv'],
                ],
            ],
            'orderInformation' => [
                'amountDetails' => [
                    'totalAmount' => number_format((float) $booking->total_amount, 2, '.', ''),
                    'currency' => 'BOB',
                ],
                'billTo' => [
                    'address1' => $data['billing_address1'] ?? 'Calle Herber 123',
                    'administrativeArea' => $data['billing_administrative_area'] ?? 'L',
                    'country' => $data['billing_country'] ?? 'BO',
                    'locality' => $data['billing_locality'] ?? 'La Paz',
                    'firstName' => $data['billing_first_name'] ?? 'Roberto',
                    'lastName' => $data['billing_last_name'] ?? 'Jimenez',
                    'phoneNumber' => $data['billing_phone'] ?? '65612459',
                    'email' => $booking->contact_email,
                ],
            ],
        ];
    }

    private function sendCybersourceRequest(string $url, array $payload): array
    {
        $jsonString = $this->json_dumps($payload);
        $keyc = 'RhX6x8VUrji8D7JpuKyxF3wqbSJmfrcV3VK0Z/euxrs=';
        $clave = '49e40d24-9068-4d71-8ca9-18054e76d737';
        $date_transaction = $this->get_date();
        $blue_print = $this->get_blueprint($jsonString);
        $headers_string = $this->get_headers_string($date_transaction, $blue_print, $url, 'redenlace_000014');
        $signature_hash = $this->get_signature_hash($headers_string, $keyc);
        $signature = $this->get_signature($signature_hash, $clave);
        $headersReq = [
            'Host' => 'apitest.cybersource.com',
            'Date' => $date_transaction,
            'Digest' => 'SHA-256=' . $blue_print,
            'v-c-merchant-id' => 'redenlace_000014',
            'Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/hal+json;charset=utf-8',
        ];
        $res = Http::withHeaders($headersReq)
            ->withBody($jsonString, 'application/json')
            ->post('https://apitest.cybersource.com' . $url);
        $body = json_decode($res->body(), true);

        return [
            'status' => $res->status(),
            'body' => $body ?? ['raw' => $res->body()],
        ];
    }

}
