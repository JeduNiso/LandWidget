import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton"
         [style.width]="width"
         [style.height]="height"
         [style.border-radius]="radius"
         [style.margin-bottom]="mb"
         aria-hidden="true">
    </div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        rgba(200,210,230,0.3) 25%,
        rgba(200,210,230,0.6) 50%,
        rgba(200,210,230,0.3) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.6s infinite linear;
      display: block;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonComponent {
  @Input() width  = '100%';
  @Input() height = '20px';
  @Input() radius = '8px';
  @Input() mb     = '0px';
}
