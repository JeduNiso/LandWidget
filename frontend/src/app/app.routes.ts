import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { PasajesBusComponent } from './pages/pasajes-bus/pasajes-bus.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'pasajes-bus', component: PasajesBusComponent },
  { path: '**', redirectTo: '' },
];
