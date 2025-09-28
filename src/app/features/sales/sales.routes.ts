import { Routes } from '@angular/router';
import { SalesHistoryComponent } from './pages/sales-history/sales-history.component';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full',
  },
  //   {
  //     path: 'pos',
  //     component: PointOfSaleComponent,
  //   },
  {
    path: 'history',
    component: SalesHistoryComponent,
  },
];
