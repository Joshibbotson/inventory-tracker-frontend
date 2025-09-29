// production-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../products/models/product.model';
import { ProductsService } from '../../../products/services/products.service';
import {
  ProductionService,
  ProductionBatch,
} from '../../services/production.service';

@Component({
  selector: 'app-production-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">
            Production Batches
          </h1>
          <p class="mt-1 text-sm text-neutral-600">
            Track finished goods production and material consumption
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex gap-2">
          <a
            routerLink="/production/new"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <svg
              class="mr-2 -ml-1 h-5 w-5"
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
            Create Batch
          </a>
          <button
            (click)="exportBatches()"
            class="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
          >
            <svg
              class="mr-2 -ml-1 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <!-- Product Filter -->
          <div class="sm:col-span-2">
            <label
              for="product"
              class="block text-sm font-medium text-neutral-700"
              >Filter by Product</label
            >
            <select
              id="product"
              [(ngModel)]="selectedProduct"
              (ngModelChange)="filterBatches()"
              class="mt-1 block w-full rounded-lg border-neutral-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
            >
              <option value="">All Products</option>
              @for (product of products(); track product._id) {
              <option [value]="product._id">
                {{ product.name }} ({{ product.sku }})
              </option>
              }
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label
              for="startDate"
              class="block text-sm font-medium text-neutral-700"
              >From Date</label
            >
            <input
              type="date"
              id="startDate"
              [(ngModel)]="startDate"
              (ngModelChange)="filterBatches()"
              class="mt-1 block w-full rounded-lg border-neutral-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              for="endDate"
              class="block text-sm font-medium text-neutral-700"
              >To Date</label
            >
            <input
              type="date"
              id="endDate"
              [(ngModel)]="endDate"
              (ngModelChange)="filterBatches()"
              class="mt-1 block w-full rounded-lg border-neutral-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div
          class="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
        >
          <dt class="text-sm font-medium text-neutral-500">Total Batches</dt>
          <dd class="mt-1 text-3xl font-semibold text-neutral-900">
            {{ filteredBatches().length }}
          </dd>
        </div>
        <div
          class="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
        >
          <dt class="text-sm font-medium text-neutral-500">
            Total Units Produced
          </dt>
          <dd class="mt-1 text-3xl font-semibold text-neutral-900">
            {{ calculateTotalProduced() | number : '1.0-0' }}
          </dd>
        </div>
        <div
          class="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
        >
          <dt class="text-sm font-medium text-neutral-500">Total Cost</dt>
          <dd class="mt-1 text-3xl font-semibold text-neutral-900">
            £{{ calculateTotalCost() | number : '1.2-2' }}
          </dd>
        </div>
        <div
          class="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
        >
          <dt class="text-sm font-medium text-neutral-500">Avg Unit Cost</dt>
          <dd class="mt-1 text-3xl font-semibold text-neutral-900">
            £{{ calculateAverageUnitCost() | number : '1.2-2' }}
          </dd>
        </div>
      </div>

      <!-- Batches Table -->
      @if (loading()) {
      <div class="flex justify-center items-center h-64">
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
      } @else if (filteredBatches().length === 0) {
      <div
        class="text-center py-12 bg-white rounded-lg border-2 border-dashed border-neutral-300"
      >
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-neutral-900">
          No production batches found
        </h3>
        <p class="mt-1 text-sm text-neutral-500">
          Get started by creating your first production batch.
        </p>
        <div class="mt-6">
          <a
            routerLink="/production/new"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700"
          >
            <svg
              class="mr-2 -ml-1 h-5 w-5"
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
            Create Batch
          </a>
        </div>
      </div>
      } @else {
      <div class="bg-white shadow-sm rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Batch Number
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Product
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Quantity
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Unit Cost
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Total Cost
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Notes
              </th>
              <th class="relative px-6 py-3">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            @for (batch of filteredBatches(); track batch._id) {
            <tr class="hover:bg-neutral-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {{ formatDate(batch.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                >
                  {{ batch.batchNumber }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-neutral-900">
                    {{ getProductName(batch.product) }}
                  </div>
                  <div class="text-xs text-neutral-500">
                    {{ getProductSku(batch.product) }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {{ batch.quantity }} units
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                £{{ batch.unitCost | number : '1.2-2' }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900"
              >
                £{{ batch.totalCost | number : '1.2-2' }}
              </td>
              <td class="px-6 py-4 text-sm text-neutral-500">
                <span
                  class="truncate block max-w-xs"
                  [title]="batch.notes || ''"
                >
                  {{ batch.notes || '-' }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  (click)="viewBatchDetails(batch)"
                  class="text-amber-600 hover:text-amber-900"
                >
                  View Details
                </button>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
      }

      <!-- Batch Details Modal -->
      @if (selectedBatch()) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4">
          <div
            class="fixed inset-0 bg-black opacity-30"
            (click)="selectedBatch.set(null)"
          ></div>
          <div
            class="relative bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-medium text-neutral-900">
                  Production Batch Details
                </h3>
                <p class="text-sm text-neutral-500 mt-1">
                  {{ selectedBatch()!.batchNumber }}
                </p>
              </div>
              <button
                (click)="selectedBatch.set(null)"
                class="text-neutral-400 hover:text-neutral-500"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <!-- Basic Info -->
              <div>
                <h4 class="text-sm font-medium text-neutral-900 mb-3">
                  Production Information
                </h4>
                <dl class="grid grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-neutral-500">Date</dt>
                    <dd class="mt-1 text-sm text-neutral-900">
                      {{ formatDate(selectedBatch()!.createdAt) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-neutral-500">
                      Product
                    </dt>
                    <dd class="mt-1 text-sm text-neutral-900">
                      {{ getProductName(selectedBatch()!.product) }} ({{
                        getProductSku(selectedBatch()!.product)
                      }})
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-neutral-500">
                      Quantity Produced
                    </dt>
                    <dd class="mt-1 text-sm text-neutral-900">
                      {{ selectedBatch()!.quantity }} units
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-neutral-500">
                      Unit Cost
                    </dt>
                    <dd class="mt-1 text-sm text-neutral-900">
                      £{{ selectedBatch()!.unitCost | number : '1.2-2' }}
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Material Costs Breakdown -->
              <div>
                <h4 class="text-sm font-medium text-neutral-900 mb-3">
                  Material Costs Breakdown
                </h4>
                <div
                  class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg"
                >
                  <table class="min-w-full divide-y divide-neutral-300">
                    <thead class="bg-neutral-50">
                      <tr>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                        >
                          Material
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                        >
                          Quantity Used
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                        >
                          Unit Cost at Time
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                        >
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-neutral-200">
                      @for (cost of selectedBatch()!.materialCosts; track
                      $index) {
                      <tr>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900"
                        >
                          {{ getMaterialName(cost.material) }}
                        </td>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500"
                        >
                          {{ cost.quantity }}
                          {{ getMaterialUnit(cost.material) }}
                        </td>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500"
                        >
                          £{{ cost.unitCostAtTime | number : '1.2-2' }}
                        </td>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900"
                        >
                          £{{ cost.totalCost | number : '1.2-2' }}
                        </td>
                      </tr>
                      }
                    </tbody>
                    <tfoot class="bg-neutral-50">
                      <tr>
                        <td
                          colspan="3"
                          class="px-6 py-3 text-sm font-medium text-neutral-900"
                        >
                          Total Material Cost
                        </td>
                        <td
                          class="px-6 py-3 text-sm font-bold text-neutral-900"
                        >
                          £{{ selectedBatch()!.totalCost | number : '1.2-2' }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              @if (selectedBatch()!.notes) {
              <div>
                <h4 class="text-sm font-medium text-neutral-900 mb-3">Notes</h4>
                <p
                  class="text-sm text-neutral-600 bg-neutral-50 p-4 rounded-lg"
                >
                  {{ selectedBatch()!.notes }}
                </p>
              </div>
              }
            </div>

            <div class="mt-6 flex justify-end">
              <button
                (click)="selectedBatch.set(null)"
                class="px-4 py-2 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [],
})
export class ProductionListComponent implements OnInit {
  private productionService = inject(ProductionService);
  private productsService = inject(ProductsService);

  batches = signal<ProductionBatch[]>([]);
  filteredBatches = signal<ProductionBatch[]>([]);
  products = signal<Product[]>([]);
  selectedBatch = signal<ProductionBatch | null>(null);
  loading = signal(true);

  selectedProduct = '';
  startDate = '';
  endDate = '';

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);

    try {
      const [batches, products] = await Promise.all([
        this.productionService.getProductionHistory().toPromise(),
        this.productsService.getProducts().toPromise(),
      ]);

      this.batches.set(batches || []);
      this.filteredBatches.set(batches || []);
      this.products.set(products || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  filterBatches() {
    this.loading.set(true);

    this.productionService
      .getProductionHistory(
        this.selectedProduct || undefined,
        this.startDate || undefined,
        this.endDate || undefined
      )
      .subscribe({
        next: (batches) => {
          this.batches.set(batches);
          this.filteredBatches.set(batches);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error filtering batches:', error);
          this.loading.set(false);
        },
      });
  }

  calculateTotalProduced(): number {
    return this.filteredBatches().reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );
  }

  calculateTotalCost(): number {
    return this.filteredBatches().reduce(
      (sum, batch) => sum + batch.totalCost,
      0
    );
  }

  calculateAverageUnitCost(): number {
    const total = this.calculateTotalCost();
    const units = this.calculateTotalProduced();
    return units > 0 ? total / units : 0;
  }

  getProductName(product: any): string {
    if (typeof product === 'object' && product?.name) {
      return product.name;
    }
    return 'Unknown Product';
  }

  getProductSku(product: any): string {
    if (typeof product === 'object' && product?.sku) {
      return product.sku;
    }
    return '-';
  }

  getMaterialName(material: any): string {
    if (typeof material === 'object' && material?.name) {
      return material.name;
    }
    return 'Unknown Material';
  }

  getMaterialUnit(material: any): string {
    if (typeof material === 'object' && material?.unit) {
      if (typeof material.unit === 'object' && material.unit.abbreviation) {
        return material.unit.abbreviation;
      }
    }
    return '';
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  viewBatchDetails(batch: ProductionBatch) {
    this.selectedBatch.set(batch);
  }

  exportBatches() {
    const headers = [
      'Date',
      'Batch Number',
      'Product',
      'SKU',
      'Quantity',
      'Unit Cost',
      'Total Cost',
      'Notes',
    ];
    const rows = this.filteredBatches().map((batch) => [
      this.formatDate(batch.createdAt),
      batch.batchNumber,
      this.getProductName(batch.product),
      this.getProductSku(batch.product),
      batch.quantity.toString(),
      batch.unitCost.toFixed(2),
      batch.totalCost.toFixed(2),
      batch.notes || '',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `production-batches-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
