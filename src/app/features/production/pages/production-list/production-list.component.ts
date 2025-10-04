// production-list.component.ts
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
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
import { PaginationFooterComponent } from '../../../../core/components/pagination-footer/pagination-footer.component';
import { Pagination } from '../../../../core/types/Pagination';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-production-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReversalModalComponent,
    WasteModalComponent,
    PaginationFooterComponent,
  ],
  templateUrl: './production-list.component.html',
  styles: [],
})
export class ProductionListComponent implements OnInit {
  private readonly productionService = inject(ProductionService);
  private readonly destroyRef = inject(DestroyRef);

  batches = signal<ProductionBatch[]>([]);
  products = signal<Product[]>([]);
  selectedBatch = signal<ProductionBatch | null>(null);
  reversalBatch = signal<ProductionBatch | null>(null);
  reversalCheck = signal<{ canReverse: boolean; reason?: string } | null>(null);
  wasteBatch = signal<ProductionBatch | null>(null);
  loading = signal(true);
  reversing = signal(false);
  wasting = signal(false);
  pagination = signal<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  selectedProduct = '';
  startDate = '';
  endDate = '';
  searchQuery = signal('');

  // Summary stats from backend
  totalActiveUnits = signal(0);
  totalReversedUnits = signal(0);
  totalActiveCost = signal(0);
  totalReversedCost = signal(0);

  searchTerm = '';
  search = new Subject<string>();
  filterChange = new Subject<void>();

  ngOnInit() {
    this.loadData();
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
          this.loadData(1); // Reset to page 1 on search
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
          this.loadData(1); // Reset to page 1 on filter change
        },
      });
  }

  async loadData(page = 1) {
    this.loading.set(true);

    this.productionService
      .getProductionHistory(page, this.pagination().pageSize, {
        searchTerm: this.searchQuery(),
        startDate: this.startDate,
        endDate: this.endDate,
      })
      .subscribe({
        next: (res) => {
          this.batches.set(res.data || []);
          this.pagination.set({
            page: res.page,
            pageSize: res.pageSize,
            total: res.total,
          });

          // Update summary stats if provided by backend
          if (res.summary) {
            this.totalActiveUnits.set(res.summary.activeUnits || 0);
            this.totalReversedUnits.set(res.summary.reversedUnits || 0);
            this.totalActiveCost.set(res.summary.activeCost || 0);
            this.totalReversedCost.set(res.summary.reversedCost || 0);
          }
        },
        error: (err) => {
          console.error('Error loading data:', err);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }

  handleSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.search.next(value);
  }

  filterBatches() {
    this.pagination.update((p) => ({ ...p, page: 1 }));
    this.loadData(1);
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
    const rows = this.batches().map((batch) => [
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

  initiateWaste(batch: ProductionBatch, e: Event) {
    e.stopPropagation();
    this.wasteBatch.set(batch);
  }

  initiateReversal(batch: ProductionBatch, e: Event) {
    e.stopPropagation();
    this.reversalBatch.set(batch);

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
          alert(result.message);
          this.loadData(this.pagination().page);
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

    this.wasting.set(true);

    this.productionService
      .wasteBatch(batch._id, wasteReason, quantity)
      .subscribe({
        next: (result) => {
          this.wasting.set(false);
          this.cancelWaste();
          alert(result.message);
          this.loadData(this.pagination().page);
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

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.pagination.update((p) => ({ ...p, page }));
    this.loadData(page);
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
    this.loadData(1);
  }
}
