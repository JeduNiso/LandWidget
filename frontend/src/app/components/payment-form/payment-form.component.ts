import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PendingBooking, PaymentPayload } from '../../models/bus.models';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
})
export class PaymentFormComponent implements OnInit {
  @Input() pending!: PendingBooking;
  @Output() pay = new EventEmitter<PaymentPayload>();
  @Output() back = new EventEmitter<void>();

  // Form fields
  cardNumber   = '';
  cardHolder   = '';
  expiryInput  = '';   // "MM/YY"
  cvv          = '';
  billingDepartment = '';
  billingAddress    = '';
  billingEmail      = '';
  billingPhone      = '';
  paymentType: 'otp' | 'sin_otp' = 'otp';

  departments = [
    'La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Potosí',
    'Chuquisaca', 'Tarija', 'Beni', 'Pando',
  ];

  // UI state
  cardFlipped  = false;
  processing   = false;

  // -------------------------------------------------------------------------
  // Card type detection
  // -------------------------------------------------------------------------
  get cardType(): 'visa' | 'mastercard' | 'amex' | 'diners' | 'unknown' {
    const n = this.rawNumber;
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    if (/^3(?:0[0-5]|[68])/.test(n)) return 'diners';
    return 'unknown';
  }

  get isAmex(): boolean { return this.cardType === 'amex'; }

  // -------------------------------------------------------------------------
  // Display helpers
  // -------------------------------------------------------------------------
  get rawNumber(): string { return this.cardNumber.replace(/\D/g, ''); }

  get displayNumber(): string {
    const raw = this.rawNumber.padEnd(this.isAmex ? 15 : 16, '•');
    if (this.isAmex) {
      return `${raw.slice(0, 4)} ${raw.slice(4, 10)} ${raw.slice(10, 15)}`;
    }
    return `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
  }

  get displayHolder(): string {
    return this.cardHolder.trim() || 'NOMBRE APELLIDO';
  }

  get displayExpiry(): string {
    return this.expiryInput || 'MM/AA';
  }

  get displayCvv(): string {
    return this.cvv ? '•'.repeat(this.cvv.length) : (this.isAmex ? '••••' : '•••');
  }

  get expiryMonth(): number { return parseInt(this.expiryInput.split('/')[0] ?? '0', 10); }
  get expiryYear(): number {
    const yy = this.expiryInput.split('/')[1] ?? '0';
    return parseInt('20' + yy, 10);
  }

  // -------------------------------------------------------------------------
  // Input formatters
  // -------------------------------------------------------------------------
  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '');
    const maxLen = this.isAmex ? 15 : 16;
    raw = raw.slice(0, maxLen);

    let formatted: string;
    if (this.isAmex) {
      formatted = [raw.slice(0, 4), raw.slice(4, 10), raw.slice(10, 15)]
        .filter(Boolean).join(' ');
    } else {
      formatted = (raw.match(/.{1,4}/g) ?? []).join(' ');
    }

    this.cardNumber = formatted;
    input.value     = formatted;
  }

  onExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '').slice(0, 4);

    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }

    this.expiryInput = raw;
    input.value      = raw;
  }

  onCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const max   = this.isAmex ? 4 : 3;
    this.cvv    = input.value.replace(/\D/g, '').slice(0, max);
    input.value = this.cvv;
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  get isValid(): boolean {
    const minLen     = this.isAmex ? 15 : 16;
    const cvvLen     = this.isAmex ? 4  : 3;
    return (
      this.rawNumber.length === minLen &&
      this.cardHolder.trim().length >= 3 &&
      /^\d{2}\/\d{2}$/.test(this.expiryInput) &&
      this.expiryMonth >= 1 && this.expiryMonth <= 12 &&
      this.cvv.length === cvvLen &&
      this.billingDepartment !== '' &&
      this.billingAddress.trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.billingEmail.trim()) &&
      this.billingPhone.trim().length >= 7
    );
  }

  onSubmit(): void {
    if (!this.isValid || this.processing) return;
    this.processing = true;

    // Emit después de un pequeño delay para mostrar la animación de procesamiento
    setTimeout(() => {
      this.pay.emit({
        card_number:     this.rawNumber,
        cardholder_name: this.cardHolder.trim(),
        expiry_month:    this.expiryMonth,
        expiry_year:     this.expiryYear,
        cvv:             this.cvv,
        billing_locality:    this.billingDepartment,
        billing_address1:    this.billingAddress.trim(),
        billing_email:       this.billingEmail.trim(),
        billing_phone:       this.billingPhone.trim(),
        payment_type:        this.paymentType,
      });
    }, 1800);
  }

  stopProcessing(): void { this.processing = false; }

  ngOnInit(): void {}

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-BO', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
