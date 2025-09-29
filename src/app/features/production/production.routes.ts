import { Routes } from '@angular/router';
import { ProductionListComponent } from './pages/production-list/production-list.component';
import { ProductionCreateComponent } from './pages/production-create-form/production-create-form.component';

export const PRODUCTION_ROUTES: Routes = [
  {
    path: '',
    component: ProductionListComponent,
  },
  {
    path: 'new',
    component: ProductionCreateComponent,
    data: { mode: 'create' },
  },
];
