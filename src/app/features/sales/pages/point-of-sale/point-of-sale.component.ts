// point-of-sale.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductsService } from '../../products/services/products.service';
import { SalesService } from '../services/sales.service';
import { Product } from '../../products/models/product.model';
import { CartItem, CreateSaleDto } from '../models/sale.model';

@Component({
  selector: 'app-point-of-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="bg-white border-b border-neutral-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-neutral-900">Point of Sale</h1>
            <p class="mt-1 text-sm text-neutral-600">
              Process sales and manage transactions
            </p>
          </div>
          <a
            routerLink="/sales/history"
            class="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
          >
            <svg
              class="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Sales History
          </a>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <!-- Products Section -->
        <div class="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
          <!-- Search and Filter -->
          <div class="bg-white border-b border-neutral-200 p-4">
            <div class="flex gap-4">
              <div class="flex-1 relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <svg
                    class="h-5 w-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  [(ngModel)]="searchTerm"
                  (ngModelChange)="filterProducts()"
                  placeholder="Search products..."
                  class="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
              <select
                [(ngModel)]="selectedCategory"
                (ngModelChange)="filterProducts()"
                class="px-3 py-2 border border-neutral-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                <option value="regular">Regular</option>
                <option value="seasonal">Seasonal</option>
                <option value="limited_edition">Limited Edition</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <!-- Products Grid -->
          <div class="flex-1 overflow-y-auto p-4">
            @if (loading()) {
            <div class="flex justify-center items-center h-full">
              <svg
                class="animate-spin h-8 w-8 text-amber-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            } @else {
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              @for (product of filteredProducts(); track product._id) {
              <button
                (click)="addToCart(product)"
                class="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md hover:border-amber-300 transition-all text-left group"
                [class.opacity-50]="!checkAvailability(product)"
                [disabled]="!checkAvailability(product)"
              >
                <!-- Product Image -->
                @if (product.imageUrl) {
                <img
                  [src]="product.imageUrl"
                  [alt]="product.name"
                  class="w-full h-32 object-cover rounded-lg mb-3"
                />
                } @else {
                <div
                  class="w-full h-32 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg mb-3 flex items-center justify-center"
                >
                  <svg
                    class="h-16 w-16 text-amber-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    />
                  </svg>
                </div>
                }

                <h3
                  class="font-medium text-neutral-900 group-hover:text-amber-600 transition-colors"
                >
                  {{ product.name }}
                </h3>
                <p class="text-xs text-neutral-500 mt-1">{{ product.sku }}</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-lg font-bold text-neutral-900"
                    >£{{ product.sellingPrice }}</span
                  >
                  @if (!checkAvailability(product)) {
                  <span class="text-xs text-red-600">No Stock</span>
                  }
                </div>
              </button>
              }
            </div>

            @if (filteredProducts().length === 0) {
            <div class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-neutral-900">
                No products found
              </h3>
              <p class="mt-1 text-sm text-neutral-500">
                Try adjusting your search or filter
              </p>
            </div>
            } }
          </div>
        </div>

        <!-- Cart Section -->
        <div class="w-96 bg-white border-l border-neutral-200 flex flex-col">
          <!-- Cart Header -->
          <div class="bg-amber-600 text-white px-6 py-4">
            <h2 class="text-lg font-semibold">Current Sale</h2>
            <p class="text-amber-100 text-sm">{{ cartItems().length }} items</p>
          </div>

          <!-- Cart Items -->
          <div class="flex-1 overflow-y-auto">
            @if (cartItems().length === 0) {
            <div class="text-center py-12 px-6">
              <svg
                class="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-neutral-900">
                Cart is empty
              </h3>
              <p class="mt-1 text-sm text-neutral-500">
                Add products to start a sale
              </p>
            </div>
            } @else {
            <div class="divide-y divide-neutral-200">
              @for (item of cartItems(); track item.product._id) {
              <div class="p-4 hover:bg-neutral-50">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-neutral-900">
                      {{ item.product.name }}
                    </h4>
                    <p class="text-xs text-neutral-500">
                      {{ item.product.sku }}
                    </p>
                    <div class="mt-2 flex items-center gap-2">
                      <button
                        (click)="decreaseQuantity(item)"
                        class="p-1 rounded hover:bg-neutral-200"
                      >
                        <svg
                          class="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <input
                        type="number"
                        [(ngModel)]="item.quantity"
                        (ngModelChange)="updateCartTotals()"
                        min="1"
                        class="w-16 px-2 py-1 text-center border border-neutral-300 rounded text-sm"
                      />
                      <button
                        (click)="increaseQuantity(item)"
                        class="p-1 rounded hover:bg-neutral-200"
                      >
                        <svg
                          class="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="text-right ml-4">
                    <p class="text-sm font-medium text-neutral-900">
                      £{{ item.subtotal | number : '1.2-2' }}
                    </p>
                    <button
                      (click)="removeFromCart(item)"
                      class="mt-1 text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              }
            </div>
            }
          </div>

          <!-- Cart Footer -->
          @if (cartItems().length > 0) {
          <div class="border-t border-neutral-200 p-6 space-y-4">
            <!-- Totals -->
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-neutral-600">Subtotal</span>
                <span class="font-medium"
                  >£{{ cartTotal() | number : '1.2-2' }}</span
                >
              </div>
              <div class="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>£{{ cartTotal() | number : '1.2-2' }}</span>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label
                for="notes"
                class="block text-sm font-medium text-neutral-700"
                >Notes (optional)</label
              >
              <textarea
                id="notes"
                [(ngModel)]="saleNotes"
                rows="2"
                class="mt-1 block w-full rounded-lg border-neutral-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                placeholder="Add any notes about this sale..."
              ></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2">
              <button
                (click)="processSale()"
                [disabled]="processing() || cartItems().length === 0"
                class="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (processing()) {
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing... } @else { Complete Sale }
              </button>
              <button
                (click)="clearCart()"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
              >
                Clear Cart
              </button>
            </div>
          </div>
          }
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    @if (showSuccessModal()) {
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div
          class="fixed inset-0 bg-black opacity-30"
          (click)="showSuccessModal.set(false)"
        ></div>
        <div class="relative bg-white rounded-lg max-w-md w-full p-6">
          <div class="text-center">
            <div
              class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4"
            >
              <svg
                class="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-neutral-900 mb-2">
              Sale Completed!
            </h3>
            <p class="text-sm text-neutral-600 mb-4">
              Sale of £{{ lastSaleTotal() | number : '1.2-2' }} has been
              processed successfully.
            </p>
            <button
              (click)="showSuccessModal.set(false)"
              class="w-full px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
            >
              Start New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [],
})
export class PointOfSaleComponent implements OnInit {
  private productsService = inject(ProductsService);
  private salesService = inject(SalesService);

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  cartItems = signal<CartItem[]>([]);
  loading = signal(true);
  processing = signal(false);
  showSuccessModal = signal(false);
  lastSaleTotal = signal(0);

  searchTerm = '';
  selectedCategory = '';
  saleNotes = '';

  cartTotal = computed(() => {
    return this.cartItems().reduce((total, item) => total + item.subtotal, 0);
  });

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.productsService.getActiveProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.filteredProducts.set(products);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading.set(false);
      },
    });
  }

  filterProducts() {
    let filtered = this.products();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter((p) => p.category === this.selectedCategory);
    }

    this.filteredProducts.set(filtered);
  }

  checkAvailability(product: Product): boolean {
    // In a real app, this would check material availability
    // For now, we'll assume all products are available
    return true;
  }

  addToCart(product: Product) {
    const existingItem = this.cartItems().find(
      (item) => item.product._id === product._id
    );

    if (existingItem) {
      this.increaseQuantity(existingItem);
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        subtotal: product.sellingPrice,
      };
      this.cartItems.update((items) => [...items, newItem]);
    }
  }

  removeFromCart(item: CartItem) {
    this.cartItems.update((items) => items.filter((i) => i !== item));
  }

  increaseQuantity(item: CartItem) {
    item.quantity++;
    item.subtotal = item.product.sellingPrice * item.quantity;
    this.cartItems.update((items) => [...items]);
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity > 1) {
      item.quantity--;
      item.subtotal = item.product.sellingPrice * item.quantity;
      this.cartItems.update((items) => [...items]);
    }
  }

  updateCartTotals() {
    this.cartItems.update((items) => {
      items.forEach((item) => {
        item.subtotal = item.product.sellingPrice * item.quantity;
      });
      return [...items];
    });
  }

  clearCart() {
    if (this.cartItems().length > 0) {
      if (confirm('Are you sure you want to clear the cart?')) {
        this.cartItems.set([]);
        this.saleNotes = '';
      }
    }
  }

  processSale() {
    if (this.cartItems().length === 0) return;

    this.processing.set(true);

    // Prepare sale data
    const salesData: CreateSaleDto[] = this.cartItems().map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      totalPrice: item.subtotal,
      notes: this.saleNotes,
    }));

    // Process batch sale
    this.salesService.createBatchSale(salesData).subscribe({
      next: (sales) => {
        this.lastSaleTotal.set(this.cartTotal());
        this.showSuccessModal.set(true);
        this.cartItems.set([]);
        this.saleNotes = '';
        this.processing.set(false);
      },
      error: (error) => {
        console.error('Error processing sale:', error);
        this.processing.set(false);

        if (error.error?.missingMaterials) {
          const missing = error.error.missingMaterials
            .map((m: any) => `${m.materialName}: need ${m.shortage} more`)
            .join('\n');
          alert(`Cannot complete sale - insufficient materials:\n\n${missing}`);
        } else {
          alert('Failed to process sale. Please try again.');
        }
      },
    });
  }
}
