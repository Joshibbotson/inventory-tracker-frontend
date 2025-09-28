import { Routes } from '@angular/router';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { ProductFormComponent } from './pages/product-form/product-form.component';
// import { ProductListComponent } from './pages/product-list/product-list.component';
// import { ProductFormComponent } from './pages/product-form/product-form.component';
// import { ProductDetailComponent } from './pages/product-detail/product-detail.component';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductListComponent,
  },
  {
    path: 'new',
    component: ProductFormComponent,
    data: { mode: 'create' },
  },
  {
    path: ':id',
    component: ProductDetailComponent,
  },
  {
    path: ':id/edit',
    component: ProductFormComponent,
    data: { mode: 'edit' },
  },
];
