import { Component } from '@angular/core';
import { BusWidgetComponent } from './components/bus-widget/bus-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BusWidgetComponent],
  template: `
    <div class="page-bg">
      <app-bus-widget></app-bus-widget>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    app-bus-widget {
      width: 100%;
      max-width: 720px;
      background: #fff;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      box-sizing: border-box;
    }
  `],
})
export class AppComponent {}
