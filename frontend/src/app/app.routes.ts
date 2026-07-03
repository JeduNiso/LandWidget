import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Eager-loaded: landing is the entry point
  { path: '', component: LandingComponent },

  // Lazy-loaded: bus flow
  {
    path: 'pasajes-bus',
    loadComponent: () =>
      import('./pages/pasajes-bus/pasajes-bus.component').then(m => m.PasajesBusComponent),
  },

  // Auth pages (lazy)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password.component').then(
            m => m.ForgotPasswordComponent
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Protected: account (requires auth)
  {
    path: 'mi-cuenta',
    loadComponent: () =>
      import('./pages/account/account.component').then(m => m.AccountComponent),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: '' },
];
