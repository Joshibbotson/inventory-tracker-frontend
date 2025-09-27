import { Routes } from '@angular/router';
// import { PointOfSaleComponent } from './pages/point-of-sale/point-of-sale.component';
// import { SalesHistoryComponent } from './pages/sales-history/sales-history.component';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'pos',
    pathMatch: 'full',
  },
  //   {
  //     path: 'pos',
  //     component: PointOfSaleComponent,
  //   },
  //   {
  //     path: 'history',
  //     component: SalesHistoryComponent,
  //   },
];
