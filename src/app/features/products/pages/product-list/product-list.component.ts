import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { Product } from '../../models/product.model';
import { Pagination } from '../../../../core/types/Pagination';
import { PaginationFooterComponent } from '../../../../core/components/pagination-footer/pagination-footer.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationFooterComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);
  loading = signal(true);
  pagination = signal<Pagination>({
    page: 1,
    pageSize: 12,
    total: 0,
  });
  searchQuery = signal('');

  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  serverUrlPref = environment.apiUrl;

  search = new Subject<string>();
  filterChange = new Subject<void>();

  ngOnInit() {
    this.loadProducts();
    this.initSearchListener();
    this.initFilterListener();
  }

  initSearchListener(): void {
    this.search
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe({
        next: (searchTerm) => {
          this.searchTerm = searchTerm;
          this.loadProducts(1); // Reset to page 1 on search
        },
        error: (err) => {
          console.error('Search error:', err);
        },
      });
  }

  initFilterListener(): void {
    this.filterChange
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(100))
      .subscribe({
        next: () => {
          this.loadProducts(1); // Reset to page 1 on filter change
        },
      });
  }

  resetFilters() {
    this.searchTerm = '';
    this.searchQuery.set('');
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.loadProducts(1);
  }

  // Helper to check if any filters are active
  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedCategory || this.selectedStatus);
  }

  handleSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.search.next(value);
  }

  onCategoryChange() {
    this.filterChange.next();
  }

  onStatusChange() {
    this.filterChange.next();
  }

  loadProducts(page = 1) {
    this.loading.set(true);

    const opts: {
      searchTerm?: string;
      category?: string;
      status?: string;
    } = {};

    if (this.searchTerm) {
      opts.searchTerm = this.searchTerm;
    }

    if (this.selectedCategory) {
      opts.category = this.selectedCategory;
    }

    if (this.selectedStatus) {
      opts.status = this.selectedStatus;
    }

    this.productsService
      .getProducts(page, this.pagination().pageSize, opts)
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.pagination.set({
            page: res.page,
            pageSize: res.pageSize,
            total: res.total,
          });
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loading.set(false);
        },
      });
  }

  deleteProduct(product: Product) {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productsService.deleteProduct(product._id).subscribe({
        next: () => {
          this.loadProducts(this.pagination().page);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          alert(`Failed to delete product: ${error.error.message}`);
        },
      });
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.pagination.update((p) => ({ ...p, page }));
    this.loadProducts(page);
  }

  totalPages(): number {
    const total = this.pagination().total;
    const pageSize = this.pagination().pageSize;
    return Math.ceil(total / pageSize);
  }

  changePageSize(newSize: number) {
    this.pagination.update((p) => ({
      ...p,
      pageSize: newSize,
      page: 1,
    }));
    this.loadProducts(1);
  }
}
