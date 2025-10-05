import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import { ProductionService } from '../../../production/services/production.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styles: [],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private readonly productionService = inject(ProductionService);

  product = signal<Product | null>(null);
  loading = signal(true);
  saleLoading = signal(false);
  saleSuccess = signal(false);
  quantity = 1;

  serverUrlPref = environment.apiUrl;

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }
  }

  loadProduct(id: string) {
    this.loading.set(true);
    this.productsService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.loading.set(false);
        alert('Failed to load product');
        this.navigateBack();
      },
    });
  }

  calculateTotalCost(): number {
    const product = this.product();
    if (!product?.recipe) return 0;

    return product.recipe.reduce((total, item) => {
      const cost = item.material.averageCost || 0;
      return total + cost * item.quantity;
    }, 0);
  }

  calculateMargin(): number {
    const product = this.product();
    if (!product) return 0;

    const cost = this.calculateTotalCost();
    const price = product.sellingPrice;
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  }

  // REDO material production

  recordProduction(): void {
    const product = this.product();
    if (!product) return;

    this.saleLoading.set(true);
    this.saleSuccess.set(false);

    this.productionService
      .createProductionBatch(product._id, this.quantity)
      .subscribe({
        next: () => {
          this.saleLoading.set(false);
          this.saleSuccess.set(true);
          this.quantity = 1;
          setTimeout(() => this.saleSuccess.set(false), 3000);
        },
        error: (error) => {
          console.error('Error recording sale:', error);
          this.saleLoading.set(false);

          alert(`Failed to record sale: ${error['error']['message']}`);
        },
      });
  }

  deleteProduct() {
    const product = this.product();
    if (!product) return;

    if (
      confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      this.productsService.deleteProduct(product._id).subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          alert('Failed to delete product. Please try again.');
        },
      });
    }
  }

  navigateBack() {
    this.router.navigate(['/products']);
  }
}
