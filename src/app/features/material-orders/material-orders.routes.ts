import { Routes } from '@angular/router';
import { MaterialOrdersListComponent } from './pages/material-orders-list/material-orders-list.component';
import { MaterialOrderFormComponent } from './pages/material-order-form/material-order-form.component';

export const MATERIAL_ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: MaterialOrdersListComponent,
  },
  {
    path: 'new',
    component: MaterialOrderFormComponent,
    data: { mode: 'create' },
  },
  {
    path: ':id/edit',
    component: MaterialOrderFormComponent,
    data: { mode: 'edit' },
  },
];
