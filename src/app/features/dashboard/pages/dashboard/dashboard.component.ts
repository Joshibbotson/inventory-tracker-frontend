import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Material } from '../../../materials/models/material.model';
import {
  ProductionService,
  StatPeriod,
} from '../../../production/services/production.service';
import { DashboardStats } from '../../types/DashboardStats';
import { ProductionChartData } from '../../types/ProductionChartData';
import { ProductTotals } from '../../types/ProductTotals';
import { MaterialsService } from '../../../materials/services/materials.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent implements OnInit {
  private readonly productionService = inject(ProductionService);
  private readonly materialsService = inject(MaterialsService);

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

  selectedPeriod: StatPeriod = 'week';

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
      const [materialsStats, productionStats] = await Promise.all([
        firstValueFrom(this.materialsService.getMaterialsStatistics()),
        firstValueFrom(
          this.productionService.getFullProductionStats(this.selectedPeriod)
        ),
      ]);

      const {
        totalBatches,
        totalProductsProduced,
        totalProductionCost,
        averageBatchSize,
        timeline,
        productTotals,
      } = productionStats;

      // Update stats
      this.stats.set({
        totalMaterials: materialsStats.totalMaterials,
        totalProducts: materialsStats.totalMaterials || 0,
        lowStockCount: materialsStats.lowStockCount,
        outOfStockCount: materialsStats.outOfStockCount,
        totalInventoryValue: materialsStats.totalValue || 0,
        productionStats: {
          totalBatches,
          totalProductsProduced,
          totalProductionCost,
          averageBatchSize,
        },
      });

      // Set chart data directly from backend
      this.productionChartData.set(
        timeline.map((t) => ({
          date: t.date,
          quantity: t.totalQuantity,
          batches: t.batchCount,
        }))
      );

      // Set top products directly from backend
      this.productTotals.set(productTotals);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading.set(false);
    }
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
