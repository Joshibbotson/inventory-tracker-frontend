// production-list.component.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../products/models/product.model';
import { ProductsService } from '../../../products/services/products.service';
import {
  ProductionService,
  ProductionBatch,
} from '../../services/production.service';
import { ReversalModalComponent } from '../../components/reversal-modal/reversal-modal.component';
import { WasteModalComponent } from '../../components/waste-modal/waste-modal.component';

@Component({
  selector: 'app-production-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReversalModalComponent,
    WasteModalComponent,
  ],
  templateUrl: './production-list.component.html',
  styles: [],
})
export class ProductionListComponent implements OnInit {
  private productionService = inject(ProductionService);
  private productsService = inject(ProductsService);

  batches = signal<ProductionBatch[]>([]);
  filteredBatches = signal<ProductionBatch[]>([]);
  products = signal<Product[]>([]);
  selectedBatch = signal<ProductionBatch | null>(null);
  reversalBatch = signal<ProductionBatch | null>(null);
  reversalCheck = signal<{ canReverse: boolean; reason?: string } | null>(null);
  wasteBatch = signal<ProductionBatch | null>(null);
  loading = signal(true);
  reversing = signal(false);
  wasting = signal(false);

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

  calculateReversedUnits = computed(() => {
    return this.filteredBatches().reduce(
      (sum, batch) => sum + batch.reversedQuantity,
      0
    );
  });

  calculateActiveUnits = computed(() => {
    return this.filteredBatches().reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );
  });

  calculateReversedCost = computed(() => {
    return this.filteredBatches().reduce(
      (sum, batch) => sum + batch.reversedQuantity * batch.unitCost,
      0
    );
  });

  calculateActiveCost = computed(() => {
    return this.filteredBatches().reduce(
      (sum, batch) => sum + batch.totalCost,
      0
    );
  });

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

  initiateWaste(batch: ProductionBatch) {
    this.wasteBatch.set(batch);
  }
  initiateReversal(batch: ProductionBatch) {
    this.reversalBatch.set(batch);

    // Check if can reverse
    this.productionService.checkCanReverse(batch._id).subscribe({
      next: (check) => {
        this.reversalCheck.set(check);
      },
      error: (error) => {
        console.error('Error checking reversal:', error);
        this.reversalCheck.set({
          canReverse: false,
          reason: 'Failed to check reversal status',
        });
      },
    });
  }

  cancelReversal() {
    this.reversalBatch.set(null);
    this.reversalCheck.set(null);
  }

  confirmReversal(wasteOpts: { quantity: number; reversalReason: string }) {
    const { quantity, reversalReason } = wasteOpts;

    const batch = this.reversalBatch();
    if (!batch) return;

    this.reversing.set(true);

    this.productionService
      .reverseBatch(batch._id, reversalReason, quantity)
      .subscribe({
        next: (result) => {
          this.reversing.set(false);
          this.cancelReversal();

          // Show success message
          alert(result.message);

          // Reload data
          this.loadData();
        },
        error: (error) => {
          this.reversing.set(false);
          console.error('Error reversing batch:', error);

          if (error.error?.message) {
            alert(`Reversal failed: ${error.error.message}`);
          } else {
            alert('Failed to reverse production batch. Please try again.');
          }
        },
      });
  }

  cancelWaste() {
    this.wasteBatch.set(null);
  }

  confirmWaste(wasteOpts: { quantity: number; wasteReason: string }) {
    const { quantity, wasteReason } = wasteOpts;

    const batch = this.wasteBatch();
    if (!batch) return;

    this.reversing.set(true);

    this.productionService
      .wasteBatch(batch._id, wasteReason, quantity)
      .subscribe({
        next: (result) => {
          this.wasting.set(false);
          this.cancelWaste();

          // Show success message
          alert(result.message);

          // Reload data
          this.loadData();
        },
        error: (error) => {
          this.wasting.set(false);
          console.error('Error wasting batch:', error);

          if (error.error?.message) {
            alert(`Wasting failed: ${error.error.message}`);
          } else {
            alert('Failed to waste production batch. Please try again.');
          }
        },
      });
  }
}
