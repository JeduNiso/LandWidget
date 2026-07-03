import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notificaciones" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" (click)="toastService.dismiss(toast.id)"
             role="alert" tabindex="0" (keydown.enter)="toastService.dismiss(toast.id)">
          <span class="toast-icon" aria-hidden="true">{{ icons[toast.type] }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close" aria-label="Cerrar notificación"
                  (click)="$event.stopPropagation(); toastService.dismiss(toast.id)">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: min(calc(100vw - 32px), 420px);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      cursor: pointer;
      pointer-events: all;
      animation: slideUp 0.28s ease-out;
      font-family: var(--font);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .toast--success { background: #1e7a4a; color: #fff; }
    .toast--error   { background: #c0392b; color: #fff; }
    .toast--info    { background: #1a5f8a; color: #fff; }
    .toast--warning { background: #d97706; color: #fff; }

    .toast-icon { font-size: 1rem; flex-shrink: 0; }
    .toast-msg  { flex: 1; line-height: 1.4; }

    .toast-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0 4px;
      min-height: unset;
      min-width: unset;
      line-height: 1;
    }
    .toast-close:hover { color: #fff; }

    @media (max-width: 480px) {
      .toast-container { bottom: 80px; }
    }
  `],
})
export class ToastComponent {
  readonly icons: Record<string, string> = {
    success: '✓',
    error:   '✗',
    info:    'ℹ',
    warning: '⚠',
  };

  constructor(readonly toastService: ToastService) {}
}
