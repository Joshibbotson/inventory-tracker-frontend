import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AUTH_ROUTES } from './features/auth/auth.routes';

const protectedRoutes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (m) => m.DASHBOARD_ROUTES
          ),
      },
      {
        path: 'materials',
        loadChildren: () =>
          import('./features/materials/materials.routes').then(
            (m) => m.MATERIALS_ROUTES
          ),
      },
      {
        path: 'material-orders',
        loadChildren: () =>
          import('./features/material-orders/material-orders.routes').then(
            (m) => m.MATERIAL_ORDERS_ROUTES
          ),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then(
            (m) => m.PRODUCTS_ROUTES
          ),
      },
      {
        path: 'production',
        loadChildren: () =>
          import('./features/production/production.routes').then(
            (m) => m.PRODUCTION_ROUTES
          ),
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];

const publicRoutes: Routes = [...AUTH_ROUTES];

export const routes: Routes = [...publicRoutes, ...protectedRoutes];
