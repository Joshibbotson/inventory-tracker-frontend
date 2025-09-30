// material-orders-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Material } from '../../../materials/models/material.model';
import { MaterialsService } from '../../../materials/services/materials.service';
import {
  MaterialOrderService,
  MaterialOrder,
} from '../../services/material-order.service';

@Component({
  selector: 'app-material-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">Material Orders</h1>
          <p class="mt-1 text-sm text-neutral-600">
            Track material purchases and update stock levels
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex gap-2">
          <a
            routerLink="/material-orders/new"
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
            New Order
          </a>
          <button
            (click)="exportOrders()"
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
          <!-- Material Filter -->
          <div class="sm:col-span-2">
            <label
              for="material"
              class="block text-sm font-medium text-neutral-700"
              >Filter by Material</label
            >
            <select
              id="material"
              [(ngModel)]="selectedMaterial"
              (ngModelChange)="filterOrders()"
              class="mt-1 block w-full rounded-lg border-neutral-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
            >
              <option value="">All Materials</option>
              @for (material of materials(); track material._id) {
              <option [value]="material._id">
                {{ material.name }} ({{ material.sku }})
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
              (ngModelChange)="filterOrders()"
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
              (ngModelChange)="filterOrders()"
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
          <dt class="text-sm font-medium text-neutral-500">Total Orders</dt>
          <dd class="mt-1 text-3xl font-semibold text-neutral-900">
            {{ filteredOrders().length }}
          </dd>
        </div>
        <div
          class="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
        >
          <dt class="text-sm font-medium text-neutral-500">Total Spent</dt>
          <dd class="mt-1 text-3xl font-semibold text-neutral-900">
            £{{ calculateTotalSpent() | number : '1.2-2' }}
          </dd>
        </div>
        <div
          class="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
        >
          <dt class="text-sm font-medium text-neutral-500">Total Units</dt>
          <dd class="mt-1 text-3xl font-semibold text-neutral-900">
            {{ calculateTotalUnits() | number : '1.0-0' }}
          </dd>
        </div>
        <div
          class="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
        >
          <dt class="text-sm font-medium text-neutral-500">Avg Order Value</dt>
          <dd class="mt-1 text-3xl font-semibold text-neutral-900">
            £{{ calculateAverageOrderValue() | number : '1.2-2' }}
          </dd>
        </div>
      </div>

      <!-- Orders Table -->
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
      } @else if (filteredOrders().length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-neutral-900">
          No orders found
        </h3>
        <p class="mt-1 text-sm text-neutral-500">
          Get started by creating your first material order.
        </p>
        <div class="mt-6">
          <a
            routerLink="/material-orders/new"
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
            Create Order
          </a>
        </div>
      </div>
      } @else {
      <div class="bg-white shadow-sm rounded-lg overflow-x-scroll">
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
                Material
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
                Supplier
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
            @for (order of filteredOrders(); track order._id) {
            <tr class="hover:bg-neutral-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {{ formatDate(order.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-neutral-900">
                    {{ getMaterialName(order.material) }}
                  </div>
                  <div class="text-xs text-neutral-500">
                    {{ getMaterialSku(order.material) }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {{ order.quantity }} {{ getMaterialUnit(order.material) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                £{{ order.unitCost | number : '1.2-2' }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900"
              >
                £{{ order.totalCost | number : '1.2-2' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {{ order.supplier || '-' }}
              </td>
              <td class="px-6 py-4 text-sm text-neutral-500">
                <span
                  class="truncate block max-w-xs"
                  [title]="order.notes || ''"
                >
                  {{ order.notes || '-' }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <div class="flex items-center justify-end gap-2">
                  <button
                    (click)="viewOrderDetails(order)"
                    class="text-amber-600 hover:text-amber-900"
                  >
                    View
                  </button>
                  <button
                    (click)="deleteOrder(order)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
      }

      <!-- Order Details Modal -->
      @if (selectedOrder()) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4">
          <div
            class="fixed inset-0 bg-black opacity-30"
            (click)="selectedOrder.set(null)"
          ></div>
          <div class="relative bg-white rounded-lg max-w-md w-full p-6">
            <div class="flex items-start justify-between mb-4">
              <h3 class="text-lg font-medium text-neutral-900">
                Order Details
              </h3>
              <button
                (click)="selectedOrder.set(null)"
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

            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-neutral-500">Date</dt>
                <dd class="mt-1 text-sm text-neutral-900">
                  {{ formatDate(selectedOrder()!.createdAt) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-neutral-500">Material</dt>
                <dd class="mt-1 text-sm text-neutral-900">
                  {{ getMaterialName(selectedOrder()!.material) }} ({{
                    getMaterialSku(selectedOrder()!.material)
                  }})
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-neutral-500">Quantity</dt>
                <dd class="mt-1 text-sm text-neutral-900">
                  {{ selectedOrder()!.quantity }}
                  {{ getMaterialUnit(selectedOrder()!.material) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-neutral-500">Unit Cost</dt>
                <dd class="mt-1 text-sm text-neutral-900">
                  £{{ selectedOrder()!.unitCost | number : '1.2-2' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-neutral-500">Total Cost</dt>
                <dd class="mt-1 text-sm font-semibold text-neutral-900">
                  £{{ selectedOrder()!.totalCost | number : '1.2-2' }}
                </dd>
              </div>
              @if (selectedOrder()!.supplier) {
              <div>
                <dt class="text-sm font-medium text-neutral-500">Supplier</dt>
                <dd class="mt-1 text-sm text-neutral-900">
                  {{ selectedOrder()!.supplier }}
                </dd>
              </div>
              } @if (selectedOrder()!.notes) {
              <div>
                <dt class="text-sm font-medium text-neutral-500">Notes</dt>
                <dd class="mt-1 text-sm text-neutral-900">
                  {{ selectedOrder()!.notes }}
                </dd>
              </div>
              }
            </dl>

            <div class="mt-6 flex justify-end gap-3">
              <button
                (click)="selectedOrder.set(null)"
                class="px-4 py-2 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
              >
                Close
              </button>
              <button
                (click)="deleteOrder(selectedOrder()!)"
                class="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete Order
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
export class MaterialOrdersListComponent implements OnInit {
  private orderService = inject(MaterialOrderService);
  private materialsService = inject(MaterialsService);

  orders = signal<MaterialOrder[]>([]);
  filteredOrders = signal<MaterialOrder[]>([]);
  materials = signal<Material[]>([]);
  selectedOrder = signal<MaterialOrder | null>(null);
  loading = signal(true);

  selectedMaterial = '';
  startDate = '';
  endDate = '';

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);

    try {
      const [orders, materials] = await Promise.all([
        this.orderService.getOrders().toPromise(),
        this.materialsService.getMaterials().toPromise(),
      ]);

      this.orders.set(orders || []);
      this.filteredOrders.set(orders || []);
      this.materials.set(materials || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  filterOrders() {
    let filtered = this.orders();

    if (this.selectedMaterial) {
      filtered = filtered.filter((order) => {
        const materialId =
          typeof order.material === 'object'
            ? order.material._id
            : order.material;
        return materialId === this.selectedMaterial;
      });
    }

    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(
        (order) => new Date(order.createdAt!) >= start
      );
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => new Date(order.createdAt!) <= end);
    }

    this.filteredOrders.set(filtered);
  }

  calculateTotalSpent(): number {
    return this.filteredOrders().reduce(
      (sum, order) => sum + order.totalCost,
      0
    );
  }

  calculateTotalUnits(): number {
    return this.filteredOrders().reduce(
      (sum, order) => sum + order.quantity,
      0
    );
  }

  calculateAverageOrderValue(): number {
    const orders = this.filteredOrders();
    if (orders.length === 0) return 0;
    return this.calculateTotalSpent() / orders.length;
  }

  getMaterialName(material: any): string {
    if (typeof material === 'object' && material?.name) {
      return material.name;
    }
    return 'Unknown Material';
  }

  getMaterialSku(material: any): string {
    if (typeof material === 'object' && material?.sku) {
      return material.sku;
    }
    return '-';
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
    });
  }

  viewOrderDetails(order: MaterialOrder) {
    this.selectedOrder.set(order);
  }

  deleteOrder(order: MaterialOrder) {
    if (!order._id) return;

    const confirmMessage =
      `Are you sure you want to delete this order?\n\n` +
      `Material: ${this.getMaterialName(order.material)}\n` +
      `Quantity: ${order.quantity}\n` +
      `Total Cost: £${order.totalCost.toFixed(2)}\n\n` +
      `Note: This will not adjust stock levels.`;

    if (confirm(confirmMessage)) {
      this.orderService.deleteOrder(order._id).subscribe({
        next: () => {
          this.selectedOrder.set(null);
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          alert('Failed to delete order. Stock may have already been used.');
        },
      });
    }
  }

  exportOrders() {
    const headers = [
      'Date',
      'Material',
      'SKU',
      'Quantity',
      'Unit Cost',
      'Total Cost',
      'Supplier',
      'Notes',
    ];
    const rows = this.filteredOrders().map((order) => [
      this.formatDate(order.createdAt),
      this.getMaterialName(order.material),
      this.getMaterialSku(order.material),
      order.quantity.toString(),
      order.unitCost?.toFixed(2) || '0',
      order.totalCost.toFixed(2),
      order.supplier || '',
      order.notes || '',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `material-orders-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
