import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Product } from '../../../products/models/product.model';
import {
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { ProductsService } from '../../../products/services/products.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-product-search',
  imports: [],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss',
})
export class ProductSearchComponent {
  private readonly productService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  initialProductId = input<string>('');

  backendUrl = environment.apiUrl;

  searchQuery = signal('');
  products = signal<Product[]>([]);
  isLoading = signal(false);
  isOpen = signal(false);
  selectedIndex = signal(-1);

  productSelected = output<Product>();

  private searchSubject = new Subject<string>();

  constructor() {
    // Setup debounced search
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.trim().length < 2) {
            this.isLoading.set(false);
            return of([]);
          }
          this.isLoading.set(true);
          return this.productService.searchProducts(query);
        })
      )
      .subscribe({
        next: (results) => {
          this.products.set(results);
          this.isLoading.set(false);
          this.isOpen.set(results.length > 0);
          this.selectedIndex.set(-1);
        },
        error: () => {
          this.isLoading.set(false);
          this.products.set([]);
        },
      });

    // Effect to load initial material when materialId changes
    effect(() => {
      const productId = this.initialProductId();
      if (productId) {
        this.loadInitialProduct(productId);
      }
    });
  }

  private loadInitialProduct(productId: string): void {
    this.productService
      .getProduct(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (material) => {
          this.searchQuery.set(material.name);
        },
        error: (error) => {
          console.error('Error loading initial material:', error);
        },
      });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    if (value.trim().length < 2) {
      this.products.set([]);
      this.isOpen.set(false);
      return;
    }

    this.searchSubject.next(value);
  }

  onKeyDown(event: KeyboardEvent): void {
    const materialsCount = this.products().length;

    if (!this.isOpen() || materialsCount === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update((i) => (i < materialsCount - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update((i) => (i > 0 ? i - 1 : materialsCount - 1));
        break;
      case 'Enter':
        event.preventDefault();
        const selected = this.selectedIndex();
        if (selected >= 0 && selected < materialsCount) {
          this.selectProduct(this.products()[selected]);
        }
        break;
      case 'Escape':
        this.isOpen.set(false);
        break;
    }
  }

  selectProduct(product: Product): void {
    this.productSelected.emit(product);
    this.searchQuery.set(product.name);
    this.isOpen.set(false);
    this.products.set([]);
  }

  onBlur(): void {
    setTimeout(() => {
      this.isOpen.set(false);
    }, 200);
  }

  onFocus(): void {
    if (this.products().length > 0) {
      this.isOpen.set(true);
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.products.set([]);
    this.isOpen.set(false);
    this.selectedIndex.set(-1);
  }
}
