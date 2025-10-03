import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Material } from '../../../materials/models/material.model';
import { ProductionBatch } from '../../../production/services/production.service';
import { PaginatedResponse } from '../../../../core/types/PaginatedResponse';

// export interface Material {
//   _id: string;
//   name: string;
//   sku: string;
//   currentStock: number;
//   minimumStock: number;
//   category: string;
//   unit: any;
// }

// interface ProductionBatch {
//   _id: string;
//   product: any;
//   quantity: number;
//   batchNumber: string;
//   totalCost: number;
//   createdAt: string;
//   isReversed: boolean;
// }

interface ProductionStats {
  totalBatches: number;
  totalProductsProduced: number;
  totalProductionCost: number;
  averageBatchSize: number;
}

interface DashboardStats {
  totalMaterials: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  productionStats: ProductionStats;
}

interface ProductionChartData {
  date: string;
  quantity: number;
  batches: number;
}

interface ProductTotals {
  productName: string;
  totalQuantity: number;
  batchCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; // Adjust to your API base URL

  loading = signal(true);
  stats = signal<DashboardStats>({
    totalMaterials: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
    productionStats: {
      totalBatches: 0,
      totalProductsProduced: 0,
      totalProductionCost: 0,
      averageBatchSize: 0,
    },
  });

  lowStockMaterials = signal<Material[]>([]);
  outOfStockMaterials = signal<Material[]>([]);
  productionChartData = signal<ProductionChartData[]>([]);
  productTotals = signal<ProductTotals[]>([]);

  selectedPeriod = 'week';

  maxProduction = computed(() => {
    const data = this.productionChartData();
    if (data.length === 0) return 10;
    const max = Math.max(...data.map((d) => d.quantity));
    return max === 0 ? 10 : max;
  });

  maxProductTotal = computed(() => {
    const data = this.productTotals();
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d.totalQuantity));
  });

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading.set(true);

    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // Set to end of today

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      // Set start date based on selected period
      if (this.selectedPeriod === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (this.selectedPeriod === 'month') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (this.selectedPeriod === 'quarter') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (this.selectedPeriod === '6months') {
        startDate.setMonth(endDate.getMonth() - 6);
      } else if (this.selectedPeriod === 'year') {
        startDate.setMonth(endDate.getMonth() - 12);
      }

      // Load all data in parallel
      const [materials, materialsStats, productionHistory] = await Promise.all([
        firstValueFrom(
          this.http.post<PaginatedResponse<Material>>( // this will need to be changed
            `${this.apiUrl}/materials/find-all`, // we'll need to fetch all stats
            {}
          )
        ),
        firstValueFrom(
          this.http.get<any>(`${this.apiUrl}/materials/statistics`)
        ),
        firstValueFrom(
          this.http.get<ProductionBatch[]>(
            `${
              this.apiUrl
            }/production/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          )
        ),
      ]);

      // Process materials for low stock
      const lowStock = materials.data.filter(
        (m) => m.currentStock > 0 && m.currentStock <= m.minimumStock
      );
      const outOfStock = materials.data.filter((m) => m.currentStock === 0);

      this.lowStockMaterials.set(lowStock);
      this.outOfStockMaterials.set(outOfStock);

      // Calculate production stats
      const activeBatches = productionHistory.filter((b) => !b.isReversed);
      const totalProductsProduced = activeBatches.reduce(
        (sum, b) => sum + b.quantity,
        0
      );
      const totalProductionCost = activeBatches.reduce(
        (sum, b) => sum + b.totalCost,
        0
      );
      const averageBatchSize =
        activeBatches.length > 0
          ? totalProductsProduced / activeBatches.length
          : 0;

      // Update stats
      this.stats.set({
        totalMaterials: materials.total,
        totalProducts: materialsStats.totalMaterials || 0,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalInventoryValue: materialsStats.totalValue || 0,
        productionStats: {
          totalBatches: activeBatches.length,
          totalProductsProduced,
          totalProductionCost,
          averageBatchSize,
        },
      });

      // Process production chart data (timeline)
      this.processProductionChartData(activeBatches, startDate, endDate);

      // Process product totals (bar chart)
      this.processProductTotals(activeBatches);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private processProductionChartData(
    batches: ProductionBatch[],
    startDate: Date,
    endDate: Date
  ) {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dataPoints: ProductionChartData[] = [];

    // Determine grouping strategy based on period length
    let groupBy: 'day' | 'week' | 'month' = 'day';
    let intervals = daysDiff + 1;

    if (daysDiff > 90) {
      // For 6 months and 12 months, group by month
      groupBy = 'month';
      const monthsDiff = Math.ceil(daysDiff / 30);
      intervals = monthsDiff;
    } else if (daysDiff > 30) {
      // For 90 days, group by week
      groupBy = 'week';
      intervals = Math.ceil(daysDiff / 7);
    }

    // Create data points based on grouping
    for (let i = 0; i < intervals; i++) {
      let periodStart: Date;
      let periodEnd: Date;
      let dateStr: string;

      if (groupBy === 'day') {
        periodStart = new Date(startDate);
        periodStart.setDate(startDate.getDate() + i);
        periodEnd = new Date(periodStart);
        periodEnd.setHours(23, 59, 59, 999);
        dateStr = periodStart.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        periodStart = new Date(startDate);
        periodStart.setDate(startDate.getDate() + i * 7);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        dateStr = periodStart.toISOString().split('T')[0];
      } else {
        // month
        periodStart = new Date(startDate);
        periodStart.setMonth(startDate.getMonth() + i);
        periodStart.setDate(1);
        periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);
        dateStr = periodStart.toISOString().split('T')[0];
      }

      const periodBatches = batches.filter((b) => {
        const batchDate = new Date(b.createdAt);
        return batchDate >= periodStart && batchDate <= periodEnd;
      });

      dataPoints.push({
        date: dateStr,
        quantity: periodBatches.reduce((sum, b) => sum + b.quantity, 0),
        batches: periodBatches.length,
      });
    }

    this.productionChartData.set(dataPoints);
  }

  private processProductTotals(batches: ProductionBatch[]) {
    const productMap = new Map<string, ProductTotals>();

    batches.forEach((batch) => {
      const productName = batch.product?.name || 'Unknown Product';
      const existing = productMap.get(productName);

      if (existing) {
        existing.totalQuantity += batch.quantity;
        existing.batchCount += 1;
      } else {
        productMap.set(productName, {
          productName,
          totalQuantity: batch.quantity,
          batchCount: 1,
        });
      }
    });

    // Convert to array and sort by quantity
    const totals = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5); // Top 5 products

    this.productTotals.set(totals);
  }

  formatChartDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();

    // For longer periods, show month and year
    const daysDiff = Math.ceil(
      (new Date().getTime() -
        new Date(this.getStartDateForPeriod()).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysDiff > 90) {
      return `${month} ${year}`;
    } else if (daysDiff > 30) {
      return `${day} ${month}`;
    }
    return `${day} ${month}`;
  }

  private getStartDateForPeriod(): Date {
    const endDate = new Date();
    const startDate = new Date();

    if (this.selectedPeriod === 'week') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (this.selectedPeriod === 'month') {
      startDate.setDate(endDate.getDate() - 30);
    } else if (this.selectedPeriod === 'quarter') {
      startDate.setDate(endDate.getDate() - 90);
    } else if (this.selectedPeriod === '6months') {
      startDate.setMonth(endDate.getMonth() - 6);
    } else if (this.selectedPeriod === 'year') {
      startDate.setMonth(endDate.getMonth() - 12);
    }

    return startDate;
  }

  getLinePoints(): string {
    const data = this.productionChartData();
    if (data.length === 0) return '';

    const max = this.maxProduction();

    if (data.length === 1) {
      const y = 100 - (data[0].quantity / max) * 100;
      return `50,${y}`;
    }

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.quantity / max) * 100;
      return `${x},${y}`;
    });

    return points.join(' ');
  }

  getAreaPoints(): string {
    const data = this.productionChartData();
    if (data.length === 0) return '';

    const max = this.maxProduction();

    if (data.length === 1) {
      const y = 100 - (data[0].quantity / max) * 100;
      return `45,${y} 55,${y} 55,100 45,100`;
    }

    const topPoints = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.quantity / max) * 100;
      return `${x},${y}`;
    });

    return [...topPoints, '100,100', '0,100'].join(' ');
  }

  getXAxisLabels(): ProductionChartData[] {
    const data = this.productionChartData();
    if (data.length <= 7) return data;

    // Show max 7 labels evenly distributed
    const step = Math.ceil(data.length / 7);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }

  getXPosition(index: number): number {
    const data = this.productionChartData();
    if (data.length === 1) return 50;
    if (data.length === 0) return 0;
    return (index / (data.length - 1)) * 100;
  }

  getYPosition(quantity: number): number {
    const max = this.maxProduction();
    if (max === 0) return 0;
    return (quantity / max) * 100;
  }

  async refreshData() {
    await this.loadDashboardData();
  }

  async onPeriodChange() {
    await this.loadDashboardData();
  }
}
